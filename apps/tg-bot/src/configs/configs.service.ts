import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { MyContext } from '../types/my-context';
import { InjectBot } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';
import { ApiService } from '../api/api.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { generateQrCode } from '../utils/generate-qr-code';
import * as fs from 'fs';
import moment from 'moment';
import { escapeMarkdownV2 } from '../utils/escape-markdown';
import { countryToEmoji } from 'functions/country-to-emoji';
import { ExtendConfigDto } from 'types/dto/config-dto/request/extend-config-dto';

@Injectable()
export class ConfigsService {
  private readonly supportUrl = process.env.TELEGRAM_SUPPORT_URL;

  constructor(
    @InjectBot() readonly bot: Telegraf<MyContext>,
    private readonly apiService: ApiService,
    @Inject(forwardRef(() => SubscriptionsService))
    private readonly subscriptionsService: SubscriptionsService
  ) {}
  async generateConfig(ctx: MyContext) {
    try {
      const payment = ctx.session?.payment;
      const tgUserId = ctx.from.id;
      const username = ctx.from.username
      const data = (ctx as any).callbackQuery?.data;
      if (!data) return;
      const messageId = ctx.callbackQuery.message.message_id;
      const locationId = ctx.session.location as any as string;

      if (!locationId) return;

      let months = 1;
      let configName = `${ctx.from.username}-${Math.floor(Date.now() / 1000)}`;

      try {
        await ctx.deleteMessage(messageId);
      } catch (error) {
        console.error('Ошибка при удалении сообщения:', error);
      }

      const isTrial = payment && payment.invoice_payload === "trial"


      months = isTrial ? 1 : this.subscriptionsService.getSubscriptionLength(payment.invoice_payload);
      configName = isTrial ? `${username} trial` : `${username} ${payment.invoice_payload}`;

      if (!isTrial)
        await ctx.reply('💸 Спасибо за оплату! 🙏')


      const location = await this.apiService.getLocationById(ctx, locationId.split("_")[2]);


      await ctx.reply(`🔄 Генерируем подключение для сервера в ${location.label}...`);


      const configData = {
        tgUserId: String(tgUserId),
        username,
        months,
        isTrial,
        name: configName,
        locationId: location.id,
        price: payment?.total_amount || 0,
        promoCode: ctx.session?.selectedPromoCode?.id || ""
      };

      const config = await this.apiService.createConfig(ctx, configData);

      if (ctx.session?.selectedPromoCode) {
        await this.apiService.usePromoCode(ctx, ctx.session.selectedPromoCode.id);
        ctx.session.selectedPromoCode = null
      }

      const qrPath = `/tmp/qrcode_${tgUserId}.png`;

      if (config)
        try {
          await generateQrCode(config.vlessUrl, qrPath);
          await ctx.replyWithPhoto(
            { source: qrPath },
            {
              caption: `✨ *Ваше подключение готово\\!*\n\n` +
                      `🔑 Ваш ключ:\n\`\`\`${config.vlessUrl}\`\`\`\n\n` +
                      `📱 Отсканируйте QR\\-код или скопируйте ключ\n` +
                      `❓ Нужна помощь? Нажмите кнопку ниже 👇`,
              parse_mode: "MarkdownV2",
              reply_markup: {
                inline_keyboard: [[{ text: "❓ Как подключиться?", callback_data: "help" }]]
              }
            }
          );
        } catch (error) {
          console.error('Ошибка при создании QR-кода:', error);
          await ctx.reply(
            `⚠️ *Что\\-то пошло не так*\n\n` +
            `Не удалось сгенерировать QR\\-код\\. Не волнуйтесь, вы все равно можете использовать текстовый ключ\\.\n\n` +
            `Если нужна помощь, обратитесь в поддержку 👇`,
            {
              parse_mode: "MarkdownV2",
              reply_markup: {
                inline_keyboard: [
                  [{ text: "🆘 Поддержка", url: this.supportUrl }]
                ]
              }
            }
          );
        } finally {
          fs.unlink(qrPath, () => {
            console.log({deleted: qrPath})
          });
        }
    } catch (error: any) {
      if (error.response?.status === 403) {
        await ctx.reply(
          `⚠️ *Пробная подписка уже использована*\n\n` +
          `Вы уже активировали пробный период ранее.\n` +
          `Хотите оформить полноценную подписку?`,
          {
            parse_mode: "MarkdownV2",
            reply_markup: {
              inline_keyboard: [[
                {
                  text: "✨ Оформить подписку",
                  callback_data: "subscribe_command"
                }
              ]]
            }
          }
        );
        return;
      }

      console.error("Ошибка при генерации подключения:", error);
      await ctx.reply(
        `⚠️ *Что\\-то пошло не так*\n\n` +
        `К сожалению, произошла ошибка. Не волнуйтесь, мы уже работаем над её устранением.\n\n` +
        `Вы можете:\n` +
        `• Попробовать снова\n` +
        `• Обратиться в поддержку\n` +
        `• Посмотреть инструкцию`,
        {
          parse_mode: "MarkdownV2",
          reply_markup: {
            inline_keyboard: [
              [
                { text: "🔄 Повторить", callback_data: "subscribe_command" },
                { text: "🆘 Поддержка", url: this.supportUrl }
              ],
              [{ text: "📖 Инструкция", callback_data: "guide" }]
            ]
          }
        }
      );
    }
  }

  showUserConfig = (client: any) => {
    const currentTime = Date.now();
    const expiryTime = (client as any).expiryTime === 0
      ? "Бесконечный"
      : (client as any).expiryTime
        ? moment(Number((client as any).expiryTime)).format("DD.MM.YYYY HH:mm")
        : "Не указано";

    const isExpired = (client as any).expiryTime !== 0 && Number((client as any).expiryTime) < currentTime;
    const statusEmoji = isExpired ? "🔴" : "🟢";

    const caption = `${statusEmoji} *${escapeMarkdownV2(client.name)}*\n`
    + `⏳ *Дата окончания*: ${escapeMarkdownV2(expiryTime)}\n`
    + `🌎 *Локация*: ${countryToEmoji((client as any).location.country)} ${escapeMarkdownV2((client as any).location.country)} ${escapeMarkdownV2((client as any).location.city)}\n`
    + `🔑 *Ссылка для подключения*:\n`
    + `\`\`\`\n${escapeMarkdownV2(client.vlessUrl)}\n\`\`\``;

    return caption;
  }

  showConfig = async (ctx: Context) => {
    try {
      this.subscriptionsService.handleCancelPayment(ctx as MyContext);

      const callbackData = (ctx.callbackQuery as any)?.data;
      if (!callbackData) {
        return;
      }

      const configId = callbackData.replace("show_config_", "");
      const client = await this.apiService.getConfigById(ctx as MyContext, configId);

      if (!client) {
        return ctx.answerCbQuery("❌ Подключение не найдено\\!", { show_alert: true });
      }

      const caption = this.showUserConfig(client)

      const qrPath = `/tmp/qrcode_${client.name}.png`;

      await generateQrCode(client.vlessUrl, qrPath);

      if (!fs.existsSync(qrPath)) {
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

  async extend(ctx: MyContext) {
    const { configToExtend, waitingForDaysInput, selectedDays, selectedMonths } = ctx.session;
    await ctx.reply("🔄 Продлеваем вашу подписку...");
    const data = await this.apiService.extendConfig(ctx, configToExtend.id, {
      useAccumulatedDays: waitingForDaysInput,
      days: waitingForDaysInput ? Number(selectedDays) : 0,
      months: waitingForDaysInput ? 0 : selectedMonths
    });
    if (data) {
      await ctx.reply(
        escapeMarkdownV2(
        `✨ Подписка успешно продлена!\n\n` +
        `🔑 Ключ: ${configToExtend.name}\n` +
        `⏳ Продлено на: ${data.daysAdded} дней\n` +
        `📅 Действует до: ${moment(Number(data.expiryTime)).format("DD.MM.YYYY HH:mm")}`),
        {
          parse_mode: "MarkdownV2",
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔑 Посмотреть ключ", callback_data: `show_config_${configToExtend.id}` }]
            ]
          }
        }
      );
    } else {
      await ctx.reply(
        `❌ *Произошла ошибка*\n\n` +
        `Не удалось продлить подписку\\. Пожалуйста, попробуйте позже или обратитесь в поддержку\\.`,
        {
          parse_mode: "MarkdownV2",
          reply_markup: {
            inline_keyboard: [
              [{ text: "🆘 Поддержка", url: this.supportUrl }]
            ]
          }
        }
      );
    }
  }
}
