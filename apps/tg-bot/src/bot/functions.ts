import { prices } from './../assets/assets';
import { countryToEmoji } from 'functions/country-to-emoji';
import { ApiService } from "../api/api.service";
import { Context, Telegraf } from 'telegraf';
import { Message, Update } from '@telegraf/types';
import { Config } from '@prisma/client';
import moment from "moment";
import fs from 'fs'
import { generateQrCode } from '../utils/generate-qr-code';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { randomUUID } from 'crypto';
import { osList } from '../assets/assets';
import { escapeMarkdownV2 } from '../utils/escape-markdown';
import { Checkout } from 'types/checkout';
import { paymentMethods } from '../assets/payment-methods';
import { MyContext } from '../types/my-context';
import { ReferralSystemService } from '../referral-system/referral-system.service';

@Injectable()
export class BotFunctions {
  private readonly providerToken = process.env.TELEGRAM_PAYMENT_TOKEN
  private readonly supportUrl = process.env.TELEGRAM_SUPPORT_URL;
  private timers = new Map<string, NodeJS.Timeout>();

  constructor(
    @InjectBot() private bot: Telegraf<MyContext>,
    private readonly apiService: ApiService,
    @Inject(forwardRef(() => ReferralSystemService))
    private readonly referralSystemService: ReferralSystemService
  ) {}

  botName = process.env.BOT_NAME;
  isProd = process.env.PRODUCTION === "true";

  getSubscriptionLength(payload: string): number {
    const match = payload.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
  }

  async handleSubscribe(ctx: Context<Update.CallbackQueryUpdate>, data: string) {
    try {
      this.handleCancelPayment(ctx as MyContext);
      (ctx as any).session = {
        ...(ctx as any).session,
        location: data
      }

      await ctx.editMessageText("Хотите использовать промокод перед выбором подписки?", {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🎟 Использовать сохраненный промокод",
                callback_data: "use_saved_promo"
              }
            ],
            [
              {
                text: "✏️ Ввести свой промокод",
                callback_data: "enter_promo"
              }
            ],
            [
              {
                text: "➡️ Пропустить и выбрать подписку",
                callback_data: "skip_promo"
              }
            ]
          ]
        }
      })
    } catch (error) {
      console.error('⚠️ Ошибка при выставлении счета!', error);
      await ctx.reply('⚠️ Ошибка при выставлении счета! \n Мы столкнулись с проблемой… 😕 \n Попробуйте снова через пару минут. ⏳');
    }
  }

  modifyPriceWithPromoCode(ctx: MyContext, price: number) {
    const selectedPromoCode = ctx.session?.selectedPromoCode;
    if (selectedPromoCode) {
      const priceInRubles = price / 100;
      const discountAmount = priceInRubles * (selectedPromoCode.discountPercent / 100);
      return priceInRubles - discountAmount;
    }
    return price / 100;
  }

  async showSubscriptionOptions(ctx: any) {
    const message = "Выберите вариант подписки";
    const keyboard = {
      inline_keyboard: prices.map((price) => ([
        {
          text: `${price.label} за ${this.modifyPriceWithPromoCode(ctx, price.amount)}₽`,
          callback_data: `choose_price_${price.key}`
        }
      ]))
    };

    if (ctx.callbackQuery) {
      await ctx.editMessageText(message, { reply_markup: keyboard });
    } else {
      await ctx.reply(message, { reply_markup: keyboard });
    }
  }

  async choosePaymentMethod(ctx: MyContext, data: string) {
    this.handleCancelPayment(ctx as MyContext);

    const currentPrice = prices.find(price => `choose_price_${price.key}` === data)
    const isTrial = currentPrice && currentPrice.key === "trial"

    if (isTrial) {
      ctx.session = {
        ...ctx.session,
        payment: {
          invoice_payload: "trial",
          total_amount: 0,
          currency: "RUB"
        }
      }
      this.generateConfig(ctx)
      return;
    }

    let finalAmount = currentPrice.amount;

    if (ctx.session && ctx.session.selectedPromoCode) {
      try {
        const promoCode = ctx.session.selectedPromoCode;
        const discountPercent = promoCode.discountPercent || 0;
        const discountAmount = Math.floor(currentPrice.amount * (discountPercent / 100));
        finalAmount = currentPrice.amount - discountAmount;
      } catch (error) {
        console.error('Error applying promo code:', error);
      }
    }

    ctx.session = {
      ...ctx.session,
      currentPrice,
      payment: {
        invoice_payload: currentPrice.key,
        total_amount: finalAmount,
        currency: "RUB"
      }
    }

    const newMessageText = "Выберите способ оплаты";
    const newKeyboard = {
      inline_keyboard: paymentMethods.map(method => ([{
        text: method.label,
        callback_data: `choose_payment_method_${method.value}`
      }]))
    };

    try {
      await ctx.editMessageText(newMessageText, {
        reply_markup: newKeyboard
      });
    } catch (error) {
      if (error.description && error.description.includes("message is not modified")) {
        console.log("Message content unchanged, skipping edit");
      } else {
        throw error;
      }
    }
  }

  async handleChoosePaymentMethod(ctx: MyContext, callback_data: string) {
    const selectedPaymentMethod = paymentMethods.find(method => `choose_payment_method_${method.value}` === callback_data)

    if (!selectedPaymentMethod) {
      return ctx.reply("❌ Выберите способ оплаты из списка");
    }

    ctx.session = {
      ...ctx.session,
      paymentMethod: selectedPaymentMethod
    }

    return this.processPayment(ctx)
  }

  async processPayment(ctx: MyContext) {
    this.handleCancelPayment(ctx as MyContext);

    const { currentPrice, paymentMethod } = ctx.session;
    const promoCodeId = ctx.session.selectedPromoCode?.id || "";

    const userId = String(ctx.from.id);
    const username = ctx.from.username
    const messageId = ctx.callbackQuery.message.message_id;
    const location = ctx.session?.location

    if (!location) return;

    let months = 1;
    let configName = `${ctx.from.username}-${Math.floor(Date.now() / 1000)}`;

    const idempotenceKey = randomUUID();
    months = this.getSubscriptionLength(`vpn_${currentPrice.key}`);
    configName = `${username} ${`vpn_${currentPrice.key}_${messageId}`}`;

    const isTrial = currentPrice && currentPrice.key === "trial"

    if (isTrial) {
      this.generateConfig(ctx)
      return;
    }

    const finalAmount = this.modifyPriceWithPromoCode(ctx, currentPrice.amount)

    console.log({ finalAmount })

    const invoiceData: Checkout = {
      amount: finalAmount * 100,
      idempotence_key: idempotenceKey,
      paymentMethod: paymentMethod.value,
      username: ctx.from.username || `anon-${ctx.from.id}`,
      email: `romanov.y.job@gmail.com`,
      items: [
        {
          description: currentPrice.label,
          amount: finalAmount * 100
        }
      ],
      payload: {
        userId,
        username,
        months,
        isTrial,
        price: finalAmount,
        name: configName,
        locationId: location.id,
        promoCode: promoCodeId
      }
    }

    const invoice = await this.apiService.createInvoice(ctx, invoiceData)

    console.log({ invoice })

    ctx.editMessageText(`Вы выбрали ${currentPrice.label}`)
    const message = await ctx.reply(`Для оплаты нажмите кнопку ниже 👇`, {
      parse_mode: "MarkdownV2",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: `Оплатить ${finalAmount}₽`,
              url: invoice.data.confirmation_url
            }
          ],
          [
            {
              text: "Отмена",
              callback_data: "cancel_payment"
            }
          ]
        ]
      }
    })

    ctx.session = {
      ...ctx.session,
      paymentMessageId: message.message_id,
      currentInvoiceId: invoice.data.id
    }

    await this.startCheckoutPolling(ctx, invoice.data.id)
  }

  async handleCancelPayment(ctx: MyContext) {
    if (!ctx.session?.currentInvoiceId) return;
    this.stopCheckoutPolling(ctx.session.currentInvoiceId)
    try {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        ctx.session.paymentMessageId,
        undefined,
        `❌ Оплата отменена`
      );
    } catch (error) {
      console.error("Ошибка при редактировании сообщения:", error);
    }
  }

  async startCheckoutPolling(ctx: MyContext, invoiceId: string) {
    let elapsed = 0;
    const interval = 5000;
    const maxTime = 10 * 60 * 1000;

    if (this.timers.has(invoiceId)) return;

    const timer = setInterval(async () => {
      const invoice = await this.apiService.findInvoice(ctx, invoiceId);
      console.log({session: ctx.session})

      if (invoice.entity.paid && invoice.entity.status === "succeeded") {
        this.stopCheckoutPolling(invoiceId);
        this.generateConfig(ctx);
      }

      elapsed += interval;
      if (elapsed >= maxTime) {
        this.stopCheckoutPolling(invoiceId);
        console.log(`Stop checking invoice: ${invoiceId}`);
      }
    }, interval);

    this.timers.set(invoiceId, timer);
  }

  stopCheckoutPolling(invoiceId: string) {
    const timer = this.timers.get(invoiceId);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(invoiceId);
      console.log(`Timer for ${invoiceId} stopped.`);
    }
  }

  async chooseLocation(ctx: MyContext) {
    try {
      this.handleCancelPayment(ctx as MyContext);

      const locations = await this.apiService.getLocations(ctx);
      if (locations.length === 0) {
        return await ctx.reply("⚠️ Нет доступных серверов\\.");
      }

      const message = await ctx.reply("🌍 Выберите страну для подключения:", {
        reply_markup: {
          inline_keyboard: locations.map(location => ([
            {
              text: `${countryToEmoji(location.country)} ${location.label} ${location.comment}`,
              callback_data: `choose_location_${location.id}`
            }
          ]))
        }
      });

      ctx.session = { ...ctx.session, locationMessageId: message.message_id, subscriptionMessageId: message.message_id };
    } catch (error) {
      console.error('Ошибка обработки подписки:', error);
      await ctx.reply('Произошла ошибка при активации подписки. Свяжитесь с поддержкой\\.', {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🆘 Поддержка", url: this.supportUrl }, { text: "Инструкция по использованию VPN", callback_data: "guide" }]
          ]
        }
      });
    }
  }

  async handleMenuButtonClick(ctx: Context<{
    message: Update.New & Update.NonChannel & Message.TextMessage;
    update_id: number;
  }>,
  ) {
    this.handleCancelPayment(ctx as MyContext);

    const text = ctx.message.text;

    if (text === "⚙ Получить ссылки для подключения" || text.includes("/connections")) {
      await this.getConfigs(ctx as any);
    }
    if (text === "🫂 Реферальная система" || text.includes("/referral")) {
      await this.referralSystemService.sendReferralSystemControlPanel(ctx as MyContext, null, true);
    }
    else if (text.includes("/menu")) {
      await this.openMenu(ctx as any)
    }
    else if (text === "💳 Подписка" || text.includes("/subscribe")) {
      await this.chooseLocation(ctx as any);
    }
    else if (text === "🆘 Поддержка") {
      await ctx.reply(`📞 Свяжись с поддержкой: ${this.supportUrl}`);
    }
    else if (text === "Инструкция по использованию VPN" || text.includes("/help")) {
      await this.showGuide(ctx as any);
    }
  }

  getConfigs = async (ctx: Context) => {
    const configs = await this.apiService.getUserConfigs(ctx as MyContext);

    if (configs.length === 0) {
      return ctx.reply(
        "✨ Похоже, у вас еще нет конфигов! 🚀 \n Ничего страшного! Вам нужно оформить подписку и мы всё сделаем! 💪",
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔥 Подписаться 💳", callback_data: "subscribe_command" }],
            ],
          },
        }
      );
    }

    const buttons = configs.map((config: Config) => [
      {
        text: `${countryToEmoji((config as any).location.country)} ${(config as any).location.city} ${config.name}`,
        callback_data: `show_config_${config.id}`,
      },
    ]);

    await ctx.reply("🔧 Ваши конфиги: \n", {
      reply_markup: { inline_keyboard: buttons },
    });
  };

  async showGuide(ctx: Context) {
    try {
      this.handleCancelPayment(ctx as MyContext);

      await ctx.reply("📖 Как пользоваться ВПН: \n Нужен гайд? Мы здесь, чтобы помочь! 💡");

      await ctx.reply("🖥️ Выберите свою ОС: \n Какие у тебя предпочтения? 🤔 Мы тебе поможем с настройкой! 🚀", {
        reply_markup: {
          inline_keyboard: [
            ...osList.map(os => ([{
              text: os.name,
              callback_data: `os_${os.key}`,
            }])),
          ],
        },
      });
    } catch (error) {
      console.error(error);
      await ctx.reply("Ошибка");
    }
  }

  showUserConfig = (client: any) => {
    const expiryTime = (client as any).expiryTime === 0
    ? "Бесконечный"
    : (client as any).expiryTime
      ? moment(Number((client as any).expiryTime)).format("DD.MM.YYYY HH:mm")
      : "Не указано";

    console.log({client})

    const caption = `*${escapeMarkdownV2(client.name)}*\n`
    + `⏳ *Дата окончания*: ${escapeMarkdownV2(expiryTime)}\n`
    + `🌎 *Локация*: ${countryToEmoji((client as any).location.country)} ${escapeMarkdownV2((client as any).location.country)} ${escapeMarkdownV2((client as any).location.city)}\n`
    + `🔑 *Ссылка для подключения*:\n`
    + `\`\`\`\n${escapeMarkdownV2(client.vlessUrl)}\n\`\`\``;

    return caption;
  }


  showConfig = async (ctx: Context) => {
    try {
      this.handleCancelPayment(ctx as MyContext);

      const callbackData = (ctx.callbackQuery as any)?.data;
      if (!callbackData) {
        console.log('No callback data');
        return;
      }

      const configId = callbackData.replace("show_config_", "");
      const client = await this.apiService.getConfigById(ctx as MyContext, configId);

      if (!client) {
        console.log('Config not found');
        return ctx.answerCbQuery("❌ Конфиг не найден!", { show_alert: true });
      }

      const caption = this.showUserConfig(client)

      const qrPath = `/tmp/qrcode_${client.name}.png`;

      await generateQrCode(client.vlessUrl, qrPath);

      if (!fs.existsSync(qrPath)) {
        console.log('QR code file not found');
        return ctx.reply('Ошибка при генерации QR-кода');
      }


      await ctx.replyWithPhoto(
        { source: fs.createReadStream(qrPath) },
        {
          caption: caption,
          parse_mode: "MarkdownV2"
        }
      );

      fs.unlinkSync(qrPath);

    } catch (error) {
      console.error('Error in showConfig:', error);
      await ctx.reply('Произошла ошибка при отображении конфигурации');
    }
  };

  async getServers(ctx: Context<{
    message: Update.New & Update.NonChannel & Message.TextMessage;
    update_id: number;
  }>, apiService: ApiService) {
    try {
      this.handleCancelPayment(ctx as MyContext);

      const locations = await apiService.getLocations(ctx as MyContext);
      if (locations.length > 0) {
        await ctx.reply("🖥️ Вот актуальный список наших серверов:", {
          reply_markup: {
            inline_keyboard: locations.map(location => ([
              {
                text: `${countryToEmoji(location.country)} ${location.country} ${location.city}`,
                callback_data: `select_server_${location.id}`
              }
            ]))
          }
        })
      }
    } catch (error) {
      console.error({error})
      ctx.reply("Не удалось получить список серверов 😟")
    }
  }

  async generateConfig(ctx: MyContext) {
    try {
      const payment = ctx.session?.payment;
      const tgUserId = ctx.from.id;
      const username = ctx.from.username
      const data = (ctx as any).callbackQuery?.data;
      if (!data) return;
      const messageId = ctx.callbackQuery.message.message_id;
      const location = ctx.session.location;

      if (!location) return;

      let months = 1;
      let configName = `${ctx.from.username}-${Math.floor(Date.now() / 1000)}`;

      try {
        await ctx.deleteMessage(messageId);
      } catch (error) {
        console.error('Ошибка при удалении сообщения:', error);
      }

      const isTrial = payment && payment.invoice_payload === "trial"


      months = isTrial ? 1 : this.getSubscriptionLength(payment.invoice_payload);
      configName = isTrial ? `${username} trial` : `${username} ${payment.invoice_payload}`;

      if (!isTrial)
        await ctx.reply('💸 Спасибо за оплату! 🙏')

      await ctx.reply(`🔄 Генерируем подключение для сервера в ${location.label}...`);

      console.log("✅ Перед вызовом createConfig");

      const configData = {
        tgUserId: String(tgUserId),
        username,
        months,
        isTrial,
        name: configName,
        locationId: location.id,
        price: payment?.total_amount || 0,
        promoCode: ""
      };

      const config = await this.apiService.createConfig(ctx, configData);

      if (ctx.session?.selectedPromoCode) {
        console.log("Использован промокод: ", {selectedPromoCode: ctx.session.selectedPromoCode})
        await this.apiService.usePromoCode(ctx, ctx.session.selectedPromoCode.id);
      }

      const qrPath = `/tmp/qrcode_${tgUserId}.png`;

      if (config)
        try {
          await generateQrCode(config.vlessUrl, qrPath);
          await ctx.replyWithPhoto({ source: qrPath }, {
            caption: `🎉 Ваше подключение готово:\n\`\`\`${config.vlessUrl}\`\`\`\n🔄 Что дальше? Нажми "Что делать дальше?" ниже 👇`,
            parse_mode: "MarkdownV2",
            reply_markup: {
              inline_keyboard: [[{ text: "❓ Что делать дальше?", callback_data: "help" }]]
            }
          });
        } catch (error) {
          console.error('Ошибка при создании QR-кода:', error);
          await ctx.reply('⚠️ Ошибка при генерации QR-кода. Свяжитесь с поддержкой\\.');
        } finally {
          fs.unlink(qrPath, () => {
            console.log({deleted: qrPath})
          });
        }
    } catch (error: any) {
      if (error.response?.status === 403) {
        await ctx.reply("⛔ Вы уже использовали пробную подписку ранее. \nПопробуйте еще раз", {
          reply_markup: {
            inline_keyboard: [[
              {
                text: "🔁 Попробовать еще раз",
                callback_data: "subscribe_command"
              }
            ]]
          }
        });
        return;
      }

      console.error("Ошибка при генерации подключения:", error);
      await ctx.reply("⚠️ Произошла ошибка. Свяжитесь с поддержкой\\.", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🆘 Поддержка", url: this.supportUrl }, { text: "Инструкция по использованию VPN", callback_data: "guide" }]
          ]
        }
      });
    }
  }

  openMenu = async (ctx: Context) => {
    await ctx.reply("📋 Панель управления 💼 \n Ты в главном меню! 🔧", {
      reply_markup: {
        keyboard: [
          [{ text: "⚙ Получить ссылки для подключения" }],
          [{ text: "💳 Подписка" }, { text: "🫂 Реферальная система" }],
          [{ text: "🆘 Поддержка" }, { text: "Инструкция по использованию VPN" }]
        ],
        resize_keyboard: true,
        one_time_keyboard: false,
      },
    });
  }
}
