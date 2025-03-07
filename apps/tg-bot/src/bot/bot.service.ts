import { Injectable } from '@nestjs/common';
import { Context, MemorySessionStore, Telegraf, session } from 'telegraf';
import { InjectBot } from 'nestjs-telegraf';
import { LabeledPrice, prices } from '../assets/assets';
import { randomUUID } from 'crypto';
import { ApiService } from '../api/api.service';
import { BotFunctions } from './functions';
import { countryToEmoji } from 'functions/country-to-emoji';

interface BotSession {
  locationMessageId?: number;
  payment?: {
    invoice_payload: string;
    total_amount: number;
    currency: string;
  };
}

export interface MyContext extends Context {
  session: BotSession;
}

@Injectable()
export class BotService {
  private readonly providerToken = process.env.TELEGRAM_PAYMENT_TOKEN
  private readonly supportUrl = process.env.TELEGRAM_SUPPORT_URL;
  constructor(
    @InjectBot() private readonly bot: Telegraf<MyContext>,
    private readonly apiService: ApiService,
    private botFunctions: BotFunctions
  ) {
    const botName = process.env.BOT_NAME;

    const store = new MemorySessionStore();
    this.bot.use(session({ store }));

    this.bot.start(async (ctx) => {
      await ctx.reply(
        `👋 Привет! Я *${botName}* — твой личный супер-помощник по VPN. 👨‍💻🚀
        Я готов помочь тебе с подключением и настройкой. Вот что я умею:\n\n` +
        `⚡ /subscribe — Купи подписку и получи доступ к VPN 🔒\n` +
        `🛠 /help — Гайд по настройке VPN. Всё, что нужно знать! 📖\n` +
        `🔑 /configs — Посмотри свой список конфигов и настрой их на устройствах 📱💻\n\n` +
        `👇 Нажми на кнопку, чтобы попасть в панель управления. Все настройки в одном месте! ⚙️`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [{ text: "🎛 Открыть панель управления", callback_data: "open_menu" }]
            ],
          },
        }
      );
    });

    this.bot.on("text", async (ctx) => {
      botFunctions.handleMenuButtonClick(ctx)
    })

    this.bot.command("menu", async (ctx) => {
      botFunctions.openMenu(ctx)
    });

    this.bot.action("subscribe_command", async (ctx) => {
      botFunctions.handleSubscribe(ctx)
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

    this.bot.action("get_configs", async (ctx) => {
      await ctx.answerCbQuery();
      await botFunctions.getConfigs(ctx)
    });

    this.bot.action("open_menu", async (ctx) => {
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
          text: "/menu",
          entities: [{ offset: 0, length: 5, type: "bot_command" }],
        },
      });
    });

    this.bot.command("help", async (ctx) => {
      botFunctions.showGuide(ctx)
    });

    this.bot.command('configs', async (ctx) => {
      await botFunctions.getConfigs(ctx)
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
      await botFunctions.handleSubscribe(ctx as any)
    });

    this.bot.on('pre_checkout_query', async (ctx) => {
      try {
        await ctx.answerPreCheckoutQuery(true);
      } catch (error) {
        console.error('Ошибка предавторизации платежа:', error);
        await ctx.reply('🚫 Ошибка предавторизации платежа! \n Подождите немного, возможно, есть проблемы с сервером. 💥');
      }
    });

    this.bot.on("message", async (ctx: any) => {
      if (!("successful_payment" in ctx.message)) return;

      const paymentInfo = ctx.message.successful_payment;

      ctx.session = {
        ...ctx.session,
        payment: {
          invoice_payload: paymentInfo.invoice_payload,
          total_amount: paymentInfo.total_amount,
          currency: paymentInfo.currency
        }
      };

      await ctx.reply("💸 Оплата прошла успешно! Теперь выбери локацию для VPN.");
      await botFunctions.generateConfig(ctx);
    });

    this.bot.command('servers', async (ctx) => {
      botFunctions.getServers(ctx, apiService)
    })

    this.bot.command('auth', async (ctx) => {
      await ctx.reply('Введите ваш email:');

      this.bot.on('text', async (messageCtx) => {
        const email = messageCtx.message.text;

        await messageCtx.reply('Введите ваш пароль:');

        this.bot.on('text', async (passwordCtx) => {
          const password = passwordCtx.message.text;

          try {
            const authResponse = await this.authenticateUser(email, password);

            if (authResponse) {
              await passwordCtx.reply(`Вы успешно авторизовались! Токен: ${authResponse.token}`);
            } else {
              await passwordCtx.reply('Не удалось авторизоваться. Проверьте email и пароль.');
            }
          } catch (error) {
            console.error(error);
            await passwordCtx.reply('Произошла ошибка при авторизации.');
          }
        });
      });
    });

    this.bot.on("callback_query", async (ctx) => {
      const data = (ctx as any).callbackQuery?.data;

      if (data && data.startsWith("show_config_")) {
        await botFunctions.showConfig(ctx)
        return;
      }

      if (data && data.startsWith("choose_location_")) {
        await botFunctions.chooseLocation(ctx)
        return;
      }
    });
  }

  async authenticateUser(email: string, password: string) {
    try {
      const response = await this.apiService.authenticateUser(email, password);
      return response.data;
    } catch (error) {
      console.error('Ошибка авторизации', error);
      return null;
    }
  }
}
