import { Injectable } from '@nestjs/common';
import { Context, Telegraf } from 'telegraf';
import { InjectBot } from 'nestjs-telegraf';
import { clients, instructions, LabeledPrice, osList, prices } from '../assets/assets';
import { randomUUID } from 'crypto';
import { ApiService } from '../api/api.service';
import { escapeMarkdownV2, getConfigs } from './functions';

@Injectable()
export class BotService {
  private readonly providerToken = process.env.TELEGRAM_PAYMENT_TOKEN
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly apiService: ApiService,
  ) {
    const botName = process.env.BOT_NAME;
    const supportUrl = process.env.TELEGRAM_SUPPORT_URL

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

    this.bot.command("menu", async (ctx) => {
      await ctx.reply("📋 Панель управления 💼 \n Ты в главном меню! 🔧 \n Здесь ты можешь настроить всё, что нужно, и получить доступ ко всем важным функциям. 👨‍💻", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "⚙ Получить конфиги", callback_data: "get_configs" }],
            [{ text: "💳 Подписка", callback_data: "subscribe_command" }],
            [{ text: "🆘 Поддержка", url: supportUrl }, { text: "Инструкция по использованию VPN", callback_data: "guide" }]
          ]
        }
      });
    });

    this.bot.action("subscribe_command", async (ctx) => {
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
          text: "/subscribe",
          entities: [{ offset: 0, length: 10, type: "bot_command" }],
        },
      });
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
      await getConfigs(ctx, this.apiService)
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
      try {
        await ctx.reply("📖 Как пользоваться ВПН: \n Нужен гайд? Мы здесь, чтобы помочь! 💡");

        await ctx.reply("🖥️ Выберите свою ОС: \n Какие у тебя предпочтения? 🤔 Мы тебе поможем с настройкой! 🚀", {
          reply_markup: {
            inline_keyboard: [
              ...osList.map(os => ([{
                text: os.name,
                callback_data: os.key,
              }])),
            ],
          },
        });

        this.bot.on("callback_query", async (ctx) => {
          const osKey = (ctx.callbackQuery as any).data;

          if (osKey === "back_to_start") {
            await ctx.editMessageText("📖 Как пользоваться ВПН:");
            await ctx.editMessageReplyMarkup({
              inline_keyboard: [
                ...osList.map(os => ([{
                  text: os.name,
                  callback_data: os.key,
                }])),
                [{ text: "Назад", callback_data: "back_to_start" }]
              ],
            });
            await ctx.answerCbQuery();
            return;
          }

          const currentOs = osList.find(os => os.key === osKey);
          if (currentOs) {
            const currentClients = clients.filter(client => client.os === osKey);
            const formattedClients = currentClients.map(client => ([{
              text: client.name,
              callback_data: client.key,
            }]));

            if (currentClients.length > 0)
              await ctx.editMessageText(
                `Выберите свой VPN клиент для *${currentOs.name}*. *${botName}* работает на протоколе VLess, поэтому можно использовать только клиенты из списка ниже: \n 🔐 Вот список поддерживаемых клиентов 🔧`,
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
            else {
              await ctx.editMessageText(`Мы еще не составили инструкций для *${currentOs.name}* 😟 \n Попробуйте погуглить, ${escapeMarkdownV2("что-то")} типа _VLess клиент для ${currentOs.key} инструкция_`, {parse_mode: "MarkdownV2", reply_markup: {
                inline_keyboard: [
                  ...formattedClients,
                  [{ text: "Назад", callback_data: "back_to_start" }]
                ],
              }})
            }

            await ctx.answerCbQuery();
          } else {
            await ctx.answerCbQuery();
            await ctx.reply("⚠️ Ошибка выбора ОС!");
          }
        });

        this.bot.on("callback_query", async (ctx) => {
          const clientKey = (ctx.callbackQuery as any).data;
          const instruction = instructions.find(instr => instr.key === clientKey);

          if (instruction) {
            await ctx.editMessageText(
              `📌 **Инструкция для ${instruction.key}**\n\n${instruction.text}\n\n🔗 [Скачать](${instruction.downloadLink})`,
              { parse_mode: "Markdown" }
            );
            await ctx.answerCbQuery();
          } else {
            await ctx.answerCbQuery();
            await ctx.reply("Инструкция не найдена 😢");
          }
        });

      } catch (error) {
        console.error(error);
        await ctx.reply("Ошибка");
      }
    });

    this.bot.command('configs', async (ctx) => {
      await getConfigs(ctx, this.apiService)
    })

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

    this.bot.command("subscribe", async (ctx) => {
      try {
        const paymentId = randomUUID();

        const generateProviderData = (price: LabeledPrice) => JSON.stringify({
          receipt: {
            items: [{
              description: price.label,
              quantity: 1,
              amount: { value: price.amount / 100, currency: "RUB" },
              vat_code: 1,
              payment_mode: "full_payment",
              payment_subject: "commodity"
            }],
            tax_system_code: 1
          }
        });

        for (const price of prices) {
          await ctx.replyWithInvoice({
            title: price.label,
            description: `${price.amount / 100} RUB за подписку`,
            payload: `vpn_${price.key}_${paymentId}`,
            provider_token: this.providerToken,
            provider_data: generateProviderData(price),
            send_email_to_provider: true,
            currency: 'RUB',
            prices: [price],
            start_parameter: 'get_access',
            need_email: true,
          });
        }
      } catch (error) {
        console.error('⚠️ Ошибка при выставлении счета!', error);
        await ctx.reply('⚠️ Ошибка при выставлении счета! \n Мы столкнулись с проблемой… 😕 \n Попробуйте снова через пару минут. ⏳');
      }
    });

    this.bot.on('pre_checkout_query', async (ctx) => {
      try {
        await ctx.answerPreCheckoutQuery(true);
      } catch (error) {
        console.error('Ошибка предавторизации платежа:', error);
        await ctx.reply('🚫 Ошибка предавторизации платежа! \n Подождите немного, возможно, есть проблемы с сервером. 💥');
      }
    });

    this.bot.on('successful_payment', async (ctx) => {
      try {
        const paymentInfo = ctx.message.successful_payment;
        const payload = paymentInfo.invoice_payload;
        const userId = ctx.chat.id;

        await ctx.reply(`💸 Спасибо за оплату! 🙏`);
        await ctx.reply('Ваш платёж прошёл успешно! Мы уже генерируем подключение для вас! ⚡');

        const config = await this.apiService.createConfig({
          userId,
          months: this.getSubscriptionLength(payload),
          name: `${ctx.from.username}-${Math.floor(Date.now() / 1000)}`
        });

        if (config) {
          await ctx.reply(
            `🎉 Ваш конфиг готов:
Вы можете подключиться прямо сейчас! 🚀
Вот ваша ссылка: \n\`\`\`\n${config.vlessUrl}\n\`\`\` \n🔄 Что дальше? Нажми “Что делать дальше?” ниже! 👇`,
            {
              parse_mode: "MarkdownV2",
              reply_markup: {
                inline_keyboard: [[{ text: "❓ Что делать дальше?", callback_data: "help" }]]
              }
            }
          );
        } else {
          await ctx.reply('⚠️ Ошибка при генерации конфига. \n Похоже, возникла проблема… 😔 \n Свяжитесь с нашей поддержкой! 🆘 \n Мы вам поможем! 👨‍💻', {
              reply_markup: {
                inline_keyboard:
                  [[{ text: "🆘 Поддержка", url: supportUrl }, { text: "Инструкция по использованию VPN", callback_data: "guide" }]]
              }
            });
        }
      } catch (error) {
        console.error('Ошибка обработки успешного платежа:', error);
        await ctx.reply('Произошла ошибка при активации подписки. Свяжитесь с поддержкой.', {
              reply_markup: {
                inline_keyboard:
                  [[{ text: "🆘 Поддержка", url: supportUrl }, { text: "Инструкция по использованию VPN", callback_data: "guide" }]]
              }
            });
      }
    });

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
  }

  getSubscriptionLength(payload: string): number {
    const match = payload.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
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
