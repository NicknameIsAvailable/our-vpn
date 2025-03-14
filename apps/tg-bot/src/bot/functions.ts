import { prices } from './../assets/assets';
import { countryToEmoji } from 'functions/country-to-emoji';
import { ApiService } from "../api/api.service";
import { Context, Telegraf } from 'telegraf';
import { Message, Update } from '@telegraf/types';
import { Config } from '@prisma/client';
import moment from "moment";
import fs from 'fs'
import { generateQrCode } from '../utils/generate-qr-code';
import { Injectable } from '@nestjs/common';
import { MyContext } from './bot.service';
import { InjectBot } from 'nestjs-telegraf';
import { randomUUID } from 'crypto';
import { osList } from '../assets/assets';
import { escapeMarkdownV2 } from '../utils/escape-markdown';
import { Checkout } from 'types/checkout';

@Injectable()
export class BotFunctions {
  private readonly providerToken = process.env.TELEGRAM_PAYMENT_TOKEN
  private readonly supportUrl = process.env.TELEGRAM_SUPPORT_URL;
  constructor(
    @InjectBot() private bot: Telegraf<MyContext>,
    private readonly apiService: ApiService,
  ) {}

  botName = process.env.BOT_NAME;
  isProd = process.env.PRODUCTION === "true";

  getSubscriptionLength(payload: string): number {
    const match = payload.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
  }

  async handleSubscribe(ctx: Context<Update.CallbackQueryUpdate>, data: string) {
    try {
      (ctx as any).session = {
        ...(ctx as any).session,
        location: data
      }

      await ctx.reply("Выберите вариант подписки", {
        reply_markup: {
          inline_keyboard: prices.map((price) => ([
            {
              text: `${price.label} за ${price.amount / 100}₽`,
              callback_data: `choose_price_${price.key}`
            }
          ]))
        }
      })
    } catch (error) {
      console.error('⚠️ Ошибка при выставлении счета!', error);
      await ctx.reply('⚠️ Ошибка при выставлении счета! \n Мы столкнулись с проблемой… 😕 \n Попробуйте снова через пару минут. ⏳');
    }
  }

  async handlePayment(ctx: MyContext, data: string) {
    // if (this.isProd) {

      const price = prices.find(price => `choose_price_${price.key}` === data)
      console.log({price, data})

      // if (price.key === "trial") {
      //   await this.generateConfig(ctx)
      //   ctx.session.payment = {
      //     invoice_payload: "trial",
      //     total_amount: 0,
      //     currency: ""
      //   }
      //   return
      // }

      const userId = String(ctx.from.id);
      const username = ctx.from.username
      const locations = await this.apiService.getLocations();
      if (!data) return;
      const messageId = ctx.callbackQuery.message.message_id;
      const selectedLocation = locations.find(loc => `choose_location_${loc.id}` === ctx.session.location);
      console.log({ selectedLocation })
      if (!selectedLocation) return;

      let months = 1;
      let configName = `${ctx.from.username}-${Math.floor(Date.now() / 1000)}`;

      const idempotenceKey = randomUUID();
      months = this.getSubscriptionLength(`vpn_${price.key}`);
      configName = `${username} ${`vpn_${price.key}_${messageId}`}`;

      const isTrial = price && price.key === "trial"

      if (isTrial) {
        this.generateConfig(ctx)
        return;
      }
      const invoiceData: Checkout = {
        amount: price.amount,
        idempotence_key: idempotenceKey,
        username: ctx.from.username || `anon-${ctx.from.id}`,
        email: `${ctx.from.first_name}@mail.com`,
        items: [
          {
            description: price.label,
            amount: price.amount
          }
        ],
        payload: {
          userId,
          username,
          months,
          isTrial,
          price: price.amount / 100,
          name: configName,
          locationId: selectedLocation.id,
          promoCode: ""
        }
      }

      const invoice = await this.apiService.createInvoice(invoiceData)

      ctx.reply(`Вы выбрали ${price.label} \n Для оплаты нажмите кнопку ниже 👇`, {
        parse_mode: "MarkdownV2",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Оплатить",
                url: invoice.data.confirmation_url
              }
            ]
          ]
        }
      })
  }

  async chooseLocation(ctx: MyContext) {
    try {
      const locations = await this.apiService.getLocations();
      if (locations.length === 0) {
        return await ctx.reply("⚠️ Нет доступных серверов.");
      }

      const message = await ctx.reply("🌍 Выберите страну сервера:", {
        reply_markup: {
          inline_keyboard: locations.map(location => ([
            {
              text: `${countryToEmoji(location.country)} ${location.city}`,
              callback_data: `choose_location_${location.id}`
            }
          ]))
        }
      });

      if (!ctx.session) {
        ctx.session = { locationMessageId: message.message_id };
      } else {
        ctx.session.locationMessageId = message.message_id;
      }

    } catch (error) {
      console.error('Ошибка обработки подписки:', error);
      await ctx.reply('Произошла ошибка при активации подписки. Свяжитесь с поддержкой.', {
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
    const text = ctx.message.text;

    if (text === "⚙ Получить ссылки для подключения" || text.includes("/connections")) {
      await this.getConfigs(ctx as any);
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
    const { chat } = ctx;
    const configs = await this.apiService.getUserConfigs(String(chat.id));

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
    const expiryTime = (client as any).config.obj.expiryTime
    ? moment((client as any).config.obj.expiryTime).format("DD.MM.YYYY HH:mm")
    : "Не указано";

    const caption = `*${escapeMarkdownV2(client.name)}*\n`
    + `⏳ *Дата окончания*: ${escapeMarkdownV2(expiryTime)}\n`
    + `🌎 *Локация*: ${countryToEmoji((client as any).location.country)} ${escapeMarkdownV2((client as any).location.country)} ${escapeMarkdownV2((client as any).location.city)}\n`
    + `🔑 *Ссылка для подключения*:\n`
    + `\`\`\`\n${escapeMarkdownV2(client.vlessUrl)}\n\`\`\``;

    return caption;
  }


  showConfig = async (ctx: Context) => {
    try {
      const callbackData = (ctx.callbackQuery as any)?.data;
      if (!callbackData) {
        console.log('No callback data');
        return;
      }

      const configId = callbackData.replace("show_config_", "");
      const client = await this.apiService.getConfigById(configId);

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
      const locations = await apiService.getLocations();
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
      const userId = String(ctx.from.id);
      const username = ctx.from.username
      const locations = await this.apiService.getLocations();
      const data = (ctx as any).callbackQuery?.data;
      if (!data) return;
      const messageId = ctx.callbackQuery.message.message_id;
      const selectedLocation = locations.find(loc => `choose_location_${loc.id}` === ctx.session.location);
      if (!selectedLocation) return;

      let months = 1;
      let configName = `${ctx.from.username}-${Math.floor(Date.now() / 1000)}`;

      try {
        await ctx.deleteMessage(messageId);
      } catch (error) {
        console.error('Ошибка при удалении сообщения:', error);
      }

      if (this.isProd) {
        if (!payment) {
          return await ctx.reply('⚠️ Оплата обязательна для использования сервиса.');
        }

        months = this.getSubscriptionLength(payment.invoice_payload);
        configName = `${username} ${payment.invoice_payload}`;
        await ctx.reply('💸 Спасибо за оплату! 🙏');
      } else {
        await ctx.reply('⚠️ Тестовый режим активен. Оплата не требуется.');
      }

      const isTrial = payment && payment.invoice_payload === "trial"

      await ctx.reply(`🔄 Генерируем подключение для сервера в ${selectedLocation.city}...`);

      const config = await this.apiService.createConfig({
        userId,
        username,
        months,
        isTrial,
        name: configName,
        locationId: selectedLocation.id,
        price: payment?.total_amount || 0,
        promoCode: ""
      });

      if ((config as any).response && (config as any).response.data.statusCode === 403) {
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

      const qrPath = `/tmp/qrcode_${userId}.png`;

      if (config)
        try {
          await generateQrCode(config.vlessUrl, qrPath);
          await ctx.replyWithPhoto({ source: qrPath }, {
            caption: `🎉 Ваше подключение готово:\n\`\`\`${config.vlessUrl}\`\`\`\n🔄 Что дальше? Нажми “Что делать дальше?” ниже 👇`,
            parse_mode: "MarkdownV2",
            reply_markup: {
              inline_keyboard: [[{ text: "❓ Что делать дальше?", callback_data: "help" }]]
            }
          });
        } catch (error) {
          console.error('Ошибка при создании QR-кода:', error);
          await ctx.reply('⚠️ Ошибка при генерации QR-кода. Свяжитесь с поддержкой.');
        } finally {
          fs.unlink(qrPath, () => {
            console.log({deleted: qrPath})
          });
        }
    } catch (e: any) {
      console.log({ e: e.response })

      console.error("Ошибка при генерации подключения:", e);
      await ctx.reply("⚠️ Произошла ошибка. Свяжитесь с поддержкой.", {
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
          [{ text: "💳 Подписка" }],
          [{ text: "🆘 Поддержка" }, { text: "Инструкция по использованию VPN" }]
        ],
        resize_keyboard: true,
        one_time_keyboard: false,
      },
    });
  }
}
