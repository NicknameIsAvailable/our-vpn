import { Injectable } from '@nestjs/common';
import { MemorySessionStore, Telegraf, session } from 'telegraf';
import { InjectBot } from 'nestjs-telegraf';
import { clients, instructions, osList } from '../assets/assets';
import { ApiService } from '../api/api.service';
import { BotFunctions } from './functions';
import path from 'path';
import fs from "fs"
import { escapeMarkdownV2 } from '../utils/escape-markdown';
import { MyContext } from '../types/my-context';
import { ReferralSystemService } from '../referral-system/referral-system.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { ConfigsService } from '../configs/configs.service';
@Injectable()
export class BotService {
  constructor(
    @InjectBot() readonly bot: Telegraf<MyContext>,
    private readonly apiService: ApiService,
    private referralSystemService: ReferralSystemService,
    private botFunctions: BotFunctions,
    private subscriptionsService: SubscriptionsService,
    private configsService: ConfigsService
  ) {
    const botName = process.env.BOT_NAME;

    const store = new MemorySessionStore<MyContext["session"]>();
    this.bot.use(session({ store }));

    this.bot.start(async (ctx) => {
      const payload = ctx.startPayload;

      if (payload?.startsWith("usepromo_")) {
        const promoCode = payload.replace("usepromo_", "");
        await this.referralSystemService.savePromoCode(ctx, promoCode);
      } else {
        await ctx.reply(
          `👋 Привет\\!Я *${botName}* — твой личный супер-помощник по VPN. 👨‍💻🚀
          Я готов помочь тебе с подключением и настройкой. Вот что я умею:\n\n` +
          `⚡ /subscribe — Купи подписку и получи доступ к VPN 🔒\n` +
          `🛠 /help — Гайд по настройке VPN. Всё, что нужно знать\\!📖\n` +
          `🔑 /connections — Посмотри свой список подключений и настрой их на устройствах 📱💻\n\n` +
          `👇 Нажми на кнопку, чтобы попасть в панель управления. Все настройки в одном месте\\!⚙️`,
          {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [{ text: "🎛 Открыть панель управления", callback_data: "open_menu" }]
              ],
            },
          }
        );
      }
    });

    this.bot.on("text", async (ctx) => {
      if (ctx.session?.waitingForPromoCode) {
        const promoCode = ctx.message.text;
        try {
          await this.referralSystemService.savePromoCode(ctx, promoCode);
          ctx.session.waitingForPromoCode = false;
          if (ctx.session.isExtending) {
            await this.subscriptionsService.showExtendOptions(ctx, ctx.session.configToExtend.id);
          } else {
            await this.subscriptionsService.showSubscriptionOptions(ctx);
          }
        } catch (error) {
          await ctx.reply("❌ Неверный промокод. Попробуйте еще раз или нажмите 'Назад' для отмены.");
        }
        return;
      }

      if (ctx.session?.waitingForDaysInput) {
        await this.subscriptionsService.handleDaysInput(ctx, ctx.message.text);
        return;
      }

      this.botFunctions.handleMenuButtonClick(ctx)
    })

    this.bot.command("menu", async (ctx) => {
      this.botFunctions.openMenu(ctx)
    });

    this.bot.action("subscribe_command", async (ctx) => {
      this.subscriptionsService.chooseLocation(ctx)
    });

    this.bot.action("guide", async (ctx) => {
      await ctx.answerCbQuery();

      const chat = ctx.update.callback_query.message?.chat;
      if (!chat || chat.type === "channel") {
        return;
      }

      await this.bot.handleUpdate({
        update_id: ctx.update.update_id,
        message: {
          message_id: ctx.update.callback_query.message?.message_id || 0,
          from: ctx.update.callback_query.from,
          chat,
          date: Math.floor(Date.now() / 1000),
          text: "/help",
          entities: [{ offset: 0, length: 5, type: "bot_command" }],
        },
      });
    });

    this.bot.on("callback_query", async (ctx) => {
      this.referralSystemService.handleCallbackData(ctx)

      const data = (ctx as any).callbackQuery?.data;

      if (data && data.startsWith("show_config_")) {
        await this.configsService.showConfig(ctx)
        return;
      }

      if (data && data === "connections") {
        await this.botFunctions.getConfigs(ctx)
        return;
      }

      if (data && data.startsWith("choose_location_")) {
        await this.subscriptionsService.handleSubscribe(ctx, data)
        return;
      }

      if (data && data === "open_menu") {
        await this.botFunctions.openMenu(ctx)
        return;
      }

      if (data && data === "help") {
        await this.botFunctions.showGuide(ctx as any);
        return
      }

      if (data === "enter_promo") {
        await ctx.editMessageText("Введите промокод в чат:", {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔙 Назад", callback_data: "skip_promo" }]
            ]
          }
        });
        ctx.session = {
          ...ctx.session,
          waitingForPromoCode: true
        };
        return;
      }

      if (data === "enter_promo_extend") {
        await ctx.editMessageText("Введите промокод в чат:", {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔙 Назад", callback_data: "extend_subscription" }]
            ]
          }
        });
        ctx.session = {
          ...ctx.session,
          waitingForPromoCode: true,
          isExtending: true
        };
        return;
      }

      if (data === "skip_promo") {
        await this.subscriptionsService.showSubscriptionOptions(ctx);
        return;
      }

      if (data.startsWith("skip_promo_extend_")) {
        const configId = data.replace("skip_promo_extend_", "");
        await this.subscriptionsService.showExtendOptions(ctx, configId);
        return;
      }

      if (data === "use_saved_promo_extend") {
        const userData = await this.apiService.getUserData(ctx);
        const savedPromoCodes = userData.savedPromoCodes;

        if (savedPromoCodes.length === 0) {
          await ctx.editMessageText("У вас нет сохраненных промокодов.", {
            reply_markup: {
              inline_keyboard: [
                [{ text: "🔙 Назад", callback_data: "extend_subscription" }]
              ]
            }
          });
          return;
        }

        const keyboard = savedPromoCodes.map(promo => [{
          text: `${promo.code} (${promo.discountPercent}% скидка)`,
          callback_data: `use_promo_extend_${promo.id}`
        }]);
        keyboard.push([{ text: "🔙 Назад", callback_data: "extend_subscription" }]);

        await ctx.editMessageText("Выберите промокод для использования:", {
          reply_markup: {
            inline_keyboard: keyboard
          }
        });
        return;
      }

      if (data.startsWith("use_promo_extend_")) {
        const promoCodeId = data.replace("use_promo_extend_", "");
        const promoCode = await this.apiService.getPromoCodeById(ctx, promoCodeId);

        if (!promoCode) {
          await ctx.editMessageText("❌ Промокод не найден", {
            reply_markup: {
              inline_keyboard: [
                [{ text: "🔙 Назад", callback_data: "extend_subscription" }]
              ]
            }
          });
          return;
        }

        ctx.session = {
          ...ctx.session,
          selectedPromoCode: promoCode
        };

        await this.subscriptionsService.showExtendOptions(ctx, ctx.session.configToExtend.id);
        return;
      }

      if (data && data.startsWith("use_promo_")) {
        await this.referralSystemService.handleUsePromoCode(ctx, data);
        return;
      }

      if (data === "extend_subscription") {
        await this.subscriptionsService.extendSubscription(ctx);
        return;
      }

      if (data === "extend_referral") {
        await this.subscriptionsService.handleExtendReferral(ctx);
        return;
      }

      if (data && data.startsWith("extend_months_")) {
        const [_, action, configId] = data.split("_").slice(1);
        const months = {
          "1m": 1,
          "3m": 3,
          "6m": 6,
          "12m": 12
        }[action];

        await this.subscriptionsService.handleExtendMonths(ctx, months, configId);
        return;
      }

      if (data && data.startsWith("extend_subscription_")) {
        const configId = data.replace("extend_subscription_", "");
        await this.subscriptionsService.handleExtendSubscription(ctx, configId);
        return;
      }

      if (data && data.startsWith("extend_month_") ||
          data.startsWith("extend_3months_") ||
          data.startsWith("extend_6months_") ||
          data.startsWith("extend_12months_")) {
        const [action, configId] = data.split("_").slice(1);
        const months = {
          "month": 1,
          "3months": 3,
          "6months": 6,
          "12months": 12
        }[action];

        const configToExtend = await this.apiService.getConfigById(ctx, configId);

        ctx.session = {
          ...ctx.session,
          configToExtend
        };

        await this.configsService.extend(ctx);
        return;
      }

      if (data && data.startsWith("choose_price_")) {
        await this.subscriptionsService.choosePaymentMethod(ctx, data)
        return;
      }

      if (data && data.startsWith("choose_payment_method_")) {
        await this.subscriptionsService.handleChoosePaymentMethod(ctx, data)
        return;
      }

      if (data && data.startsWith("cancel_payment")) {
        await this.subscriptionsService.handleCancelPayment(ctx)
        return;
      }

      if (data && data.startsWith("os_") || data.startsWith("guide_")) {
        if (osList.some(os => `os_${os.key}` === data)) {
          const osKey = data.replace("os_", "");
          const currentOs = osList.find(os => os.key === osKey);

          if (currentOs) {
            const currentClients = clients.filter(client => client.os === osKey);

            if (currentClients.length > 0) {
              const formattedClients = currentClients.map(client => ([{
                text: client.name,
                callback_data: `guide_${client.key}`,
              }]));

              await ctx.editMessageText(
                escapeMarkdownV2(`Выберите свое VPN приложение для *${currentOs.name}*. *${botName}* работает на протоколе VLess, поэтому можно использовать только приложения из списка ниже: \n 🔐 Вот список поддерживаемых приложений 🔧`),
                {
                  parse_mode: "MarkdownV2",
                  reply_markup: {
                    inline_keyboard: [
                      ...formattedClients,
                      [{ text: "Назад", callback_data: "back_to_start" }]
                    ],
                  },
                }
              );
            } else {
              await ctx.editMessageText(`Для *${currentOs.name}* приложений не найдено 😟`, { parse_mode: "MarkdownV2" });
            }
          } else {
            await ctx.answerCbQuery();
            await ctx.reply("⚠️ Ошибка выбора ОС!");
          }
        } else {
          const clientKey = data.replace("guide_", "");
          const instruction = instructions.find(instr => instr.key === clientKey);

          if (instruction) {
            await ctx.editMessageText(
              `📌 *Инструкция для ${instruction.key}*\n\n${instruction.text}\n\n🔗 [Скачать](${instruction.downloadLink})`,
              { parse_mode: "MarkdownV2" }
            );

            for (const step of instruction.steps) {
              try {
                const media = [];

                for (const image of step.images) {
                  const imagePath = path.resolve(process.cwd(), image);
                  if (fs.existsSync(imagePath)) {
                    media.push({
                      type: 'photo',
                      media: { source: imagePath },
                    });
                  }
                }

                if (media.length > 0) {
                  media[0].caption = `${step.number}. <b>${step.name}</b>\n${step.text}`;
                  media[0].parse_mode = 'HTML';

                  await ctx.replyWithMediaGroup(media);
                } else {
                  await ctx.reply(
                    `${step.number}. <b>${step.name}</b>\n${step.text}`,
                    { parse_mode: "HTML" }
                  );
                }
              } catch (error) {
                console.error(`Error processing step ${step.number}:`, error);
              }
            }
            await ctx.reply("🔥 <b>Готово!</b> Теперь ты можешь свободно пользоваться интернетом. Если что-то непонятно — сразу пиши в поддержку бота. Мы всегда рядом 💬");
          } else {
            await ctx.answerCbQuery();
            await ctx.reply("Инструкция не найдена 😢");
          }
        }
        return;
      }

      await ctx.answerCbQuery();
    });

    this.bot.action("get_configs", async (ctx) => {
      await ctx.answerCbQuery();
      await this.botFunctions.getConfigs(ctx)
    });

    this.bot.action("open_menu", async (ctx) => {
      const chat = ctx.update.callback_query.message?.chat;
      if (!chat || chat.type === "channel") {
        return;
      }

      await this.bot.handleUpdate({
        update_id: ctx.update.update_id,
        message: {
          message_id: ctx.update.callback_query.message?.message_id || 0,
          from: ctx.update.callback_query.from,
          chat,
          date: Math.floor(Date.now() / 1000),
          text: "/menu",
          entities: [{ offset: 0, length: 5, type: "bot_command" }],
        },
      });
    });

    this.bot.command("help", async (ctx) => {
      await this.botFunctions.showGuide(ctx)
    });

    this.bot.command('connections', async (ctx) => {
      await this.botFunctions.getConfigs(ctx)
    });

    this.bot.action("help", async (ctx) => {
      await ctx.answerCbQuery();

      const chat = ctx.update.callback_query.message?.chat;
      if (!chat || chat.type === "channel") {
        return;
      }

      await this.bot.handleUpdate({
        update_id: ctx.update.update_id,
        message: {
          message_id: ctx.update.callback_query.message?.message_id || 0,
          from: ctx.update.callback_query.from,
          chat,
          date: Math.floor(Date.now() / 1000),
          text: "/help",
          entities: [{ offset: 0, length: 5, type: "bot_command" }],
        },
      });
    });

    this.bot.command("subscribe", async (ctx: MyContext) => {
      await this.subscriptionsService.chooseLocation(ctx as any)
    });

    this.bot.on('pre_checkout_query', async (ctx) => {
      try {
        await ctx.answerPreCheckoutQuery(true);
      } catch (error) {
        console.error('Ошибка предавторизации платежа:', error);
        await ctx.reply('🚫 Ошибка предавторизации платежа\\!\n Подождите немного, возможно, есть проблемы с сервером. 💥', {parse_mode: "MarkdownV2"});
      }
    });

    this.bot.command('servers', async (ctx) => {
      this.botFunctions.getServers(ctx, this.apiService)
    })
  }
}
