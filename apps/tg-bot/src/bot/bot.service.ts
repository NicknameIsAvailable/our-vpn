import { Injectable } from '@nestjs/common';
import { Context, Telegraf } from 'telegraf';
import { InjectBot } from 'nestjs-telegraf';
import { firstValueFrom } from 'rxjs';
import { clients, instructions, LabeledPrice, osList, prices } from '../assets/assets';
import { randomUUID } from 'crypto';
import { ApiService } from '../api/api.service';

@Injectable()
export class BotService {
  private readonly providerToken = process.env.TELEGRAM_PAYMENT_TOKEN
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly apiService: ApiService,
  ) {
    const botName = process.env.BOT_NAME;

    this.bot.start((ctx) => ctx.reply('Привет!'));

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
        const email = paymentInfo.order_info?.email || 'не указан';
        const userId = ctx.chat.id

        await ctx.reply(`Спасибо за оплату!`, { parse_mode: "MarkdownV2" });
        await ctx.reply('Генерируем подключение для вас');

        const config = await this.apiService.createConfig({
          email,
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
