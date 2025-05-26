import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { MyContext } from '../types/my-context';
import { Context, session } from 'telegraf';
import { Update } from 'telegraf/typings/core/types/typegram';
import { LabeledPrice, prices } from '../assets/assets';
import { ApiService } from '../api/api.service';
import { ConfigsService } from '../configs/configs.service';
import { paymentMethods } from '../assets/payment-methods';
import { randomUUID } from 'crypto';
import { Checkout } from 'types/checkout';
import { countryToEmoji } from 'functions/country-to-emoji';
import { escapeMarkdownV2 } from '../utils/escape-markdown';

@Injectable()
export class SubscriptionsService {
  private timers = new Map<string, NodeJS.Timeout>();
  private readonly supportUrl = process.env.TELEGRAM_SUPPORT_URL || 'https://t.me/support';
  private botName = process.env.BOT_NAME;
  constructor(
    private readonly apiService: ApiService,
    @Inject(forwardRef(() => ConfigsService))
    private readonly configsService: ConfigsService
  ) {}

  private escapeMarkdown(text: string): string {
    return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
  }

  getSubscriptionLength(payload: string): number {
    const match = payload.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
  }

  async subscribeProposal(ctx: MyContext) {
    const configs = await this.apiService.getUserConfigs(ctx)

    if (configs.length > 0) {
      await ctx.reply(
        `🎯 *У вас уже есть активная подписка*\n\n` +
        `Что хотите сделать?\n\n` +
        `• Продлить текущую подписку\n` +
        `• Оформить новую\n` +
        `• Посмотреть текущие ключи`,
        {
          parse_mode: "MarkdownV2",
          reply_markup: {
            inline_keyboard: [
              [
                { text: "🔄 Продлить", callback_data: "extend_subscription" },
                { text: "✨ Новая", callback_data: "subscribe_command" }
              ],
              [{ text: "🔑 Мои ключи", callback_data: "connections" }]
            ]
          }
        }
      )
    } else {
      await ctx.reply(
        `✨ *Добро пожаловать в наш VPN сервис\\!*\n\n` +
        `🎁 *Преимущества подписки:*\n\n` +
        `• Получите VPN ключ в нашем сервисе\n` +
        `• Самый быстрый VPN на рынке\n` +
        `• Возможность создать VPN соединение на любом из наших серверов\n\n` +
        `🚀 *Начните использовать ${this.botName} прямо сейчас\\!*`,
        {
          parse_mode: "MarkdownV2",
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔥 Оформить подписку", callback_data: "subscribe_command" }]
            ]
          }
        }
      )
    }
  }

  async extendSubscription(ctx: MyContext) {
    const configs = await this.apiService.getUserConfigs(ctx)

    if (configs.length === 0) {
      await ctx.reply("❌ У вас пока нет активных подписок");
      return;
    }

    await ctx.editMessageText(
      `🔐 *Выберите ключ для продления*\n\n` +
      `Нажмите на ключ, который хотите продлить:`,
      {
        parse_mode: "MarkdownV2",
        reply_markup: {
          inline_keyboard: [
            ...configs.map(config => [{
              text: `${config.name} (до ${new Date(Number(config.expiryTime)).toLocaleDateString()})`,
              callback_data: `extend_subscription_${config.id}`
            }]),
            [{ text: "🔙 Назад", callback_data: "open_menu" }]
          ]
        }
      }
    )
  }

  async handleExtendSubscription(ctx: MyContext, configId: string) {
    const config = await this.apiService.getConfigById(ctx, configId);
    const userProgress = await this.apiService.getMyProgress(ctx);

    if (!config) {
      await ctx.reply("❌ Конфигурация не найдена");
      return;
    }

    ctx.session = {
      ...ctx.session,
      configToExtend: config
    }

    const expiryDate = config.expiryTime ? new Date(Number(config.expiryTime)).toLocaleDateString() : "бессрочно";

    await ctx.editMessageText(
      `🔐 *Информация о вашем ключе*\n\n` +
      `📝 Название: ${this.escapeMarkdown(config.name)}\n` +
      `⏳ Срок действия: ${this.escapeMarkdown(expiryDate)}\n` +
      `🌍 Сервер: ${this.escapeMarkdown(config.location.label)}\n\n` +
      `Хотите применить промокод перед продлением?`,
      {
        parse_mode: "MarkdownV2",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🎟 Использовать промокод", callback_data: "use_saved_promo_extend" }],
            [{ text: "✏️ Ввести новый", callback_data: "enter_promo_extend" }],
            [{ text: "➡️ Пропустить", callback_data: `skip_promo_extend_${configId}` }]
          ]
        }
      }
    );
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
      await ctx.reply('⚠️ Ошибка при выставлении счета\\!\n Мы столкнулись с проблемой… 😕 \n Попробуйте снова через пару минут. ⏳', { parse_mode: "MarkdownV2" });
    }
  }

  async handleExtendMonths(ctx: MyContext, months: string, configId: string) {
    const config = await this.apiService.getConfigById(ctx, configId);

    if (!config) {
      await ctx.reply("❌ Конфигурация не найдена");
        return;
    }

    const monthsNum = parseInt(months);
    if (isNaN(monthsNum) || monthsNum <= 0) {
      await ctx.reply("❌ Неверное количество месяцев");
      return;
    }

    ctx.session = {
      ...ctx.session,
      waitingForDaysInput: false,
      selectedMonths: monthsNum,
      configToExtend: config,
      location: config.location
    };

    await this.choosePaymentMethod(ctx, `choose_price_${monthsNum}m`)
  }

  async handleExtendReferral(ctx: MyContext) {
    const userProgress = await this.apiService.getMyProgress(ctx);

    ctx.session = {
      ...ctx.session,
      waitingForDaysInput: true,
      selectedDays: userProgress.accumulatedDays
    };

    await ctx.editMessageText(
      `Введите количество дней, которые вы хотите использовать для продления подписки \\(максимум ${userProgress.accumulatedDays} дней\\):`,
      {
        parse_mode: "MarkdownV2",
        reply_markup: {
          inline_keyboard: [[{ text: "🔙 Назад", callback_data: "extend_subscription" }]]
        }
      }
    );
  }

  async handleDaysInput(ctx: MyContext, days: string) {
    const config = ctx.session?.configToExtend;
    const maxDays = ctx.session?.selectedDays;

    if (!config || !maxDays) {
      await ctx.reply("❌ Произошла ошибка. Попробуйте снова.");
      return;
    }

    const daysNum = parseInt(days);
    if (isNaN(daysNum) || daysNum <= 0 || daysNum > maxDays) {
      await ctx.reply(`❌ Пожалуйста, введите число от 1 до ${maxDays}`);
      return;
    }

    ctx.session = {
      ...ctx.session,
      selectedDays: daysNum,
      isNewConfig: false
    }

    try {
      await this.configsService.extend(ctx);
      ctx.session = {
        ...ctx.session,
        waitingForDaysInput: false,
        isNewConfig: false
      };
    } catch (error) {
      await ctx.reply("❌ Произошла ошибка при продлении подписки");
      console.log(error)
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

  async showSubscriptionOptions(ctx: MyContext) {
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
      this.configsService.generateConfig(ctx)
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

    // Проверяем, есть ли конфиг для продления
    if (ctx.session?.configToExtend) {
      return this.processPaymentForExistingConfig(ctx);
    } else {
      return this.processPaymentForNewConfig(ctx);
    }
  }

  async processPaymentForNewConfig(ctx: MyContext) {
    const { currentPrice, paymentMethod } = ctx.session;
    const promoCodeId = ctx.session.selectedPromoCode?.id || "";
    const location = ctx.session?.location;

    if (!location) {
      await ctx.reply("❌ Ошибка: не выбрана локация. Пожалуйста, начните процесс заново.");
      return;
    }

    const userId = String(ctx.from.id);
    const username = ctx.from.username;
    const messageId = ctx.callbackQuery.message.message_id;

    let months = 1;
    let configName = `${ctx.from.username}-${Math.floor(Date.now() / 1000)}`;

    const idempotenceKey = randomUUID();
    months = this.getSubscriptionLength(`vpn_${currentPrice.key}`);
    configName = `${username} ${`vpn_${currentPrice.key}_${messageId}`}`;

    const isTrial = currentPrice && currentPrice.key === "trial";

    if (isTrial) {
      this.configsService.generateConfig(ctx);
      return;
    }

    const finalAmount = this.modifyPriceWithPromoCode(ctx, currentPrice.amount);

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
    };

    const invoice = await this.apiService.createInvoice(ctx, invoiceData);

    ctx.editMessageText(`Вы выбрали ${currentPrice.label}`);
    const message = await ctx.reply(
      `💳 *Оплата*\n\n` +
      `Сумма к оплате: *${escapeMarkdownV2(finalAmount.toString())}₽*\n\n` +
      `Нажмите кнопку ниже для перехода к оплате 👇`,
      {
        parse_mode: "MarkdownV2",
        reply_markup: {
          inline_keyboard: [
            [{ text: `💸 Оплатить ${finalAmount}₽`, url: invoice.data.confirmation_url }],
            [{ text: "❌ Отмена", callback_data: "cancel_payment" }]
          ]
        }
      }
    );

    ctx.session = {
      ...ctx.session,
      paymentMessageId: message.message_id,
      currentInvoiceId: invoice.data.id,
      isNewConfig: true
    };

    await this.startCheckoutPolling(ctx, invoice.data.id);
  }

  async processPaymentForExistingConfig(ctx: MyContext) {
    const { currentPrice, paymentMethod, configToExtend } = ctx.session;
    const promoCodeId = ctx.session.selectedPromoCode?.id || "";

    if (!configToExtend) {
      await ctx.reply("❌ Ошибка: не выбран конфиг для продления. Пожалуйста, начните процесс заново.");
      return;
    }

    const userId = String(ctx.from.id);
    const username = ctx.from.username;
    const messageId = ctx.callbackQuery.message.message_id;

    let months = 1;
    const idempotenceKey = randomUUID();
    months = this.getSubscriptionLength(`vpn_${currentPrice.key}`);

    const isTrial = currentPrice && currentPrice.key === "trial";

    if (isTrial) {
      await ctx.reply("❌ Пробный период недоступен для продления существующего конфига.");
      return;
    }

    const finalAmount = this.modifyPriceWithPromoCode(ctx, currentPrice.amount);

    const invoiceData: Checkout = {
      amount: finalAmount * 100,
      idempotence_key: idempotenceKey,
      paymentMethod: paymentMethod.value,
      username: ctx.from.username || `anon-${ctx.from.id}`,
      email: `romanov.y.job@gmail.com`,
      items: [
        {
          description: `Продление ${configToExtend.name} на ${months} ${months === 1 ? 'месяц' : 'месяца'}`,
          amount: finalAmount * 100
        }
      ],
      payload: {
        userId,
        username,
        months,
        isTrial: false,
        price: finalAmount,
        name: configToExtend.name,
        locationId: configToExtend.location.id,
        promoCode: promoCodeId,
        configId: configToExtend.id
      }
    };

    const invoice = await this.apiService.createInvoice(ctx, invoiceData);

    ctx.editMessageText(`Вы выбрали продление ${configToExtend.name} на ${months} ${months === 1 ? 'месяц' : 'месяца'}`);
    const message = await ctx.reply(
      `💳 *Оплата*\n\n` +
      `Сумма к оплате: *${escapeMarkdownV2(finalAmount.toString())}₽*\n\n` +
      `Нажмите кнопку ниже для перехода к оплате 👇`,
      {
        parse_mode: "MarkdownV2",
        reply_markup: {
          inline_keyboard: [
            [{ text: `💸 Оплатить ${finalAmount}₽`, url: invoice.data.confirmation_url }],
            [{ text: "❌ Отмена", callback_data: "cancel_payment" }]
          ]
        }
      }
    );

    ctx.session = {
      ...ctx.session,
      paymentMessageId: message.message_id,
      currentInvoiceId: invoice.data.id,
      isNewConfig: false
    };

    await this.startCheckoutPolling(ctx, invoice.data.id);
  }

  async startCheckoutPolling(ctx: MyContext, invoiceId: string) {
    let elapsed = 0;
    const interval = 5000;
    const maxTime = 10 * 60 * 1000;

    if (this.timers.has(invoiceId)) return;

    const timer = setInterval(async () => {
      const invoice = await this.apiService.findInvoice(ctx, invoiceId);

      if (invoice.entity.paid && invoice.entity.status === "succeeded") {
        this.stopCheckoutPolling(invoiceId);


        // Выбираем правильный метод в зависимости от типа операции
        if (ctx.session?.isNewConfig) {
          this.configsService.generateConfig(ctx);
        } else {
          // Продление существующего конфига
          const configToExtend = ctx.session?.configToExtend;
          const months = this.getSubscriptionLength(`vpn_${ctx.session?.currentPrice?.key}`);

          if (configToExtend) {
            ctx.session = {
              ...ctx.session,
              selectedMonths: months
            };

            await this.configsService.extend(ctx);
          }
        }
      }

      elapsed += interval;
      if (elapsed >= maxTime) {
        this.stopCheckoutPolling(invoiceId);
      }
    }, interval);

    this.timers.set(invoiceId, timer);
  }

  stopCheckoutPolling(invoiceId: string) {
    const timer = this.timers.get(invoiceId);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(invoiceId);
    }
  }

  async chooseLocation(ctx: MyContext) {
    try {
      this.handleCancelPayment(ctx as MyContext);

      const locations = await this.apiService.getLocations(ctx);
      if (locations.length === 0) {
        return await ctx.reply("⚠️ Нет доступных серверов.");
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
      await ctx.reply('Произошла ошибка при активации подписки. Свяжитесь с поддержкой.', {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🆘 Поддержка", url: this.supportUrl }, { text: "Инструкция по использованию VPN", callback_data: "guide" }]
          ]
        }
      });
    }
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

  async showExtendOptions(ctx: MyContext, configId: string) {
    const config = await this.apiService.getConfigById(ctx, configId);
    const userProgress = await this.apiService.getMyProgress(ctx);

    if (!config) {
      await ctx.reply("❌ Конфигурация не найдена");
      return;
    }

    const keyboard = [
      [
        { text: "💳 1 месяц", callback_data: `extend_months_1m_${configId}` },
        { text: "💳 3 месяца", callback_data: `extend_months_3m_${configId}` }
      ],
      [
        { text: "💳 6 месяцев", callback_data: `extend_months_6m_${configId}` },
        { text: "💳 12 месяцев", callback_data: `extend_months_12m_${configId}` }
      ],
      [{ text: "🔙 Назад", callback_data: "extend_subscription" }]
    ];

    if (userProgress && userProgress.accumulatedDays > 0) {
      keyboard.unshift([{
        text: `🎁 Использовать ${userProgress.accumulatedDays} дней`,
        callback_data: `extend_referral`
      }]);
    }

    const expiryDate = config.expiryTime ? new Date(Number(config.expiryTime)).toLocaleDateString() : "бессрочно";
    const promoCodeInfo = ctx.session?.selectedPromoCode
      ? `\n🎟 Используется промокод: ${this.escapeMarkdown(ctx.session.selectedPromoCode.code)} ${escapeMarkdownV2(`(${ctx.session.selectedPromoCode.discountPercent}% скидка)`)}`
      : '';

    await ctx.editMessageText(
      `*Информация о ключе:*\n\n` +
      `🔑 Название: ${this.escapeMarkdown(config.name)}\n` +
      `📅 Действует до: ${this.escapeMarkdown(expiryDate)}\n` +
      `🌍 Сервер: ${this.escapeMarkdown(config.location.label)}${promoCodeInfo}\n\n` +
      `Выберите насколько месяцев вы хотите продлить подписку, либо используйте дни, накопленные за рефералов:`,
      {
        parse_mode: "MarkdownV2",
        reply_markup: {
          inline_keyboard: keyboard
        }
      }
    );
  }
}
