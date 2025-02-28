import { IsString } from 'class-validator';
import { Injectable } from '@nestjs/common';
import { Context, Telegraf } from 'telegraf';
import { InjectBot } from 'nestjs-telegraf';
import { clients, instructions, LabeledPrice, osList, prices } from '../assets/assets';
import { randomUUID } from 'crypto';
import { ApiService } from '../api/api.service';
import moment from "moment"

@Injectable()
export class BotService {
  private readonly providerToken = process.env.TELEGRAM_PAYMENT_TOKEN
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly apiService: ApiService,
  ) {
    const botName = process.env.BOT_NAME;

    this.bot.start(async (ctx) => {
      await ctx.reply(
        `👋 Привет! Я *${botName}* — твой личный помощник по VPN. Вот что я умею:\n\n` +
          `🚀 /subscribe — Купить подписку\n` +
          `🛠 /help — Гайд по настройке VPN\n` +
          `🔑 /configs — Список конфигов\n`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [[{ text: "Открыть панель управления", callback_data: "open_menu" }]],
          },
        }
      );
    });

    this.bot.command("menu", async (ctx) => {
      await ctx.reply("📜 Панель управления", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "⚙ Получить конфиги", callback_data: "get_configs" }],
            [{ text: "💳 Подписка", callback_data: "subscribe_command" }],
            [{ text: "🆘 Поддержка", url: "https://t.me/support" }, { text: "Инструкция по использованию VPN", callback_data: "guide" }]
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
      const {chat} = ctx
      const configs = await this.apiService.getUserConfigs(String(chat.id))
      if (configs.length === 0) {
        ctx.reply("У вас еще нет конфигов", {
          reply_markup: {
            inline_keyboard: [
              [{
                text: "Подписаться",
                callback_data: "subscribe_command"
              }]
            ]
          }
        })
      }
      const escapeMarkdownV2 = (text: string) => {
        return text.replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1');
      };

      const formattedConfigs = configs.map(config => {
        const parsedConfig = typeof config.config === "string" ? JSON.parse(config.config) : config.config;
        const expiryTime = parsedConfig?.expiryTime
          ? moment(parsedConfig.expiryTime).format("DD.MM.YYYY HH:mm")
          : "Не указано";

        return `*${escapeMarkdownV2(config.name)}* \nДата окончания: ${escapeMarkdownV2(expiryTime)} *Ссылка для подключения:*\n\`\`\`\n${escapeMarkdownV2(config.vlessUrl)}\n\`\`\`\n`;
      });

      await ctx.reply("⚙ Ваши конфиги:");
      formattedConfigs.forEach(async config => await ctx.reply(config, { parse_mode: "MarkdownV2" }));
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
        const msg = await ctx.reply("Как пользоваться ВПН");

        await ctx.reply("Выберите свою операционную систему", {
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
            await ctx.editMessageText("Как пользоваться ВПН");
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

            await ctx.editMessageText(
              `Выберите свой VPN клиент для *${currentOs.name}*. *${botName}* работает на протоколе VLess, поэтому можно использовать только клиенты из списка ниже:`,
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
            await ctx.answerCbQuery();
          } else {
            await ctx.answerCbQuery();
            await ctx.reply("Ошибка выбора ОС");
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
            title: `${price.label} подписки`,
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
        console.error('Ошибка при выставлении счета:', error);
        await ctx.reply('Произошла ошибка при обработке платежа. Попробуйте снова.');
      }
    });

    this.bot.on('pre_checkout_query', async (ctx) => {
      try {
        await ctx.answerPreCheckoutQuery(true);
      } catch (error) {
        console.error('Ошибка предавторизации платежа:', error);
        await ctx.reply('Ошибка при обработке платежа. Попробуйте снова.');
      }
    });

    this.bot.on('successful_payment', async (ctx) => {
      try {
        const paymentInfo = ctx.message.successful_payment;
        const payload = paymentInfo.invoice_payload;
        const userId = ctx.chat.id

        await ctx.reply(`Спасибо за оплату!`);
        await ctx.reply('Генерируем подключение для вас');

        const config = await this.apiService.createConfig({
          userId,
          months: this.getSubscriptionLength(payload),
          name: `${ctx.from.username}-${Math.floor(Date.now() / 1000)}`
        });

        if (config) {
          await ctx.reply(
            `Ваш конфиг готов:\n\`\`\`\n${config.vlessUrl}\n\`\`\`
            \n [Не знаете, что делать дальше? Нажмите сюда](/help)`,
            { parse_mode: "MarkdownV2" }
          );
        } else {
          await ctx.reply('Ошибка при генерации конфига. Свяжитесь с поддержкой.');
        }
      } catch (error) {
        console.error('Ошибка обработки успешного платежа:', error);
        await ctx.reply('Произошла ошибка при активации подписки. Свяжитесь с поддержкой.');
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
