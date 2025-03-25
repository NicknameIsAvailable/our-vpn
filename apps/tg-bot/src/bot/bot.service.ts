import { Injectable } from '@nestjs/common';
import { Context, MemorySessionStore, Telegraf, session } from 'telegraf';
import { InjectBot } from 'nestjs-telegraf';
import { clients, instructions, LabeledPrice, osList } from '../assets/assets';
import { ApiService } from '../api/api.service';
import { BotFunctions } from './functions';
import path from 'path';
import fs from "fs"
import { escapeMarkdownV2 } from '../utils/escape-markdown';

interface BotSession {
  locationMessageId?: number;
  subscriptionMessageId?: number;
  paymentMessageId?: number;
  currentPrice?: LabeledPrice;
  location?: string;
  currentInvoiceId?: string;
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
        `🔑 /connections — Посмотри свой список подключений и настрой их на устройствах 📱💻\n\n` +
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
      botFunctions.chooseLocation(ctx)
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
      const data = (ctx as any).callbackQuery?.data;

      if (data && data.startsWith("show_config_")) {
        await botFunctions.showConfig(ctx)
        return;
      }

      if (data && data.startsWith("choose_location_")) {
        await botFunctions.handleSubscribe(ctx, data)
        return;
      }

      if (data && data === "open_menu") {
        await botFunctions.openMenu(ctx)
        return;
      }

      if (data && data === "help") {
        await this.botFunctions.showGuide(ctx as any);
        return
      }

      if (data && data.startsWith("choose_price_")) {
        await botFunctions.handleChoosePaymentMethod(ctx, data)
        return;
      }

      if (data && data.startsWith("choose_payment_method_")) {
        await botFunctions.handlePayment(ctx, data)
        return;
      }

      if (data && data.startsWith("cancel_payment")) {
        await botFunctions.handleCancelPayment(ctx)
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
                `Выберите свое VPN приложение для *${currentOs.name}*. *${botName}* работает на протоколе VLess, поэтому можно использовать только приложения из списка ниже: \n 🔐 Вот список поддерживаемых приложений 🔧`,
                {
                  parse_mode: "Markdown",
                  reply_markup: {
                    inline_keyboard: [
                      ...formattedClients,
                      [{ text: "Назад", callback_data: "back_to_start" }]
                    ],
                  },
                }
              );
            } else {
              await ctx.editMessageText(`Для *${currentOs.name}* приложений не найдено 😟`);
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
                  media[0].caption = `${step.number}. *${step.name}*\n${step.text}`;
                  media[0].parse_mode = 'Markdown';

                  await ctx.replyWithMediaGroup(media);
                } else {
                  await ctx.reply(
                    `${step.number}. *${step.name}*\n${step.text}`,
                    { parse_mode: "Markdown" }
                  );
                }
              } catch (error) {
                console.error(`Error processing step ${step.number}:`, error);
              }
            }
            await ctx.reply(escapeMarkdownV2("Поздравляем! Теперь ты можешь безопасно пользоваться интернетом через VPN. Если появятся вопросы — пиши в поддержку бота!"), { parse_mode: "MarkdownV2" })
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
      await botFunctions.getConfigs(ctx)
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
      await botFunctions.showGuide(ctx)
    });

    this.bot.command('connections', async (ctx) => {
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
      await botFunctions.chooseLocation(ctx as any)
    });

    this.bot.on('pre_checkout_query', async (ctx) => {
      try {
        await ctx.answerPreCheckoutQuery(true);
      } catch (error) {
        console.error('Ошибка предавторизации платежа:', error);
        await ctx.reply('🚫 Ошибка предавторизации платежа! \n Подождите немного, возможно, есть проблемы с сервером. 💥');
      }
    });

    this.bot.command('servers', async (ctx) => {
      botFunctions.getServers(ctx, apiService)
    })

  //   this.bot.command('auth', async (ctx) => {
  //     await ctx.reply('Введите ваш email:');

  //     this.bot.on('text', async (messageCtx) => {
  //       const email = messageCtx.message.text;

  //       await messageCtx.reply('Введите ваш пароль:');

  //       this.bot.on('text', async (passwordCtx) => {
  //         const password = passwordCtx.message.text;

  //         try {
  //           const authResponse = await this.authenticateUser(email, password);

  //           if (authResponse) {
  //             await passwordCtx.reply(`Вы успешно авторизовались! Токен: ${authResponse.token}`);
  //           } else {
  //             await passwordCtx.reply('Не удалось авторизоваться. Проверьте email и пароль.');
  //           }
  //         } catch (error) {
  //           console.error(error);
  //           await passwordCtx.reply('Произошла ошибка при авторизации.');
  //         }
  //       });
  //     });
  //   });
  // }

  // async authenticateUser(email: string, password: string) {
  //   try {
  //     const response = await this.apiService.authenticateUser(email, password);
  //     return response.data;
  //   } catch (error) {
  //     console.error('Ошибка авторизации', error);
  //     return null;
  //   }
  // }
  }
}
