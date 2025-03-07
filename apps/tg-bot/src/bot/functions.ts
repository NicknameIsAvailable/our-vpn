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
import { clients, instructions, LabeledPrice, osList, prices } from '../assets/assets';
import { escapeMarkdownV2 } from '../utils/escape-markdown';


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

  async handleSubscribe(ctx: Context<Update.CallbackQueryUpdate>) {
    try {
      if (this.isProd) {
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
      } else {
        this.generateConfig(ctx as MyContext)
      }
    } catch (error) {
      console.error('⚠️ Ошибка при выставлении счета!', error);
      await ctx.reply('⚠️ Ошибка при выставлении счета! \n Мы столкнулись с проблемой… 😕 \n Попробуйте снова через пару минут. ⏳');
    }
  }

  async generateConfig(ctx: MyContext) {
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

    if (text === "⚙ Получить ссылки для подключения" || text.includes("/configs")) {
      await this.getConfigs(ctx as any);
    }
    else if (text === "💳 Подписка" || text.includes("/subscribe")) {
      await this.handleSubscribe(ctx as any);
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

    await ctx.reply("🔧 Ваши конфиги: \n 🎯 Все на месте, не переживай, брат! 👌", {
      reply_markup: { inline_keyboard: buttons },
    });
  };

  async handleCallbackQuery(ctx: Context) {
    try {
      const callbackData = (ctx.callbackQuery as any).data;
      console.log('Received callback data:', callbackData); // для отладки

      if (!callbackData) return;

      await ctx.answerCbQuery(); // Важно: всегда отвечать на callback query

      if (callbackData === "back_to_start") {
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
        return;
      }

      const currentOs = osList.find(os => os.key === callbackData);
      if (currentOs) {
        const currentClients = clients.filter(client => client.os === callbackData);
        const formattedClients = currentClients.map(client => ([{
          text: client.name,
          callback_data: `client_${client.key}`,
        }]));

        if (currentClients.length > 0) {
          await ctx.editMessageText(
            `Выберите свой VPN клиент для *${currentOs.name}*. *${this.botName}* работает на протоколе VLess, поэтому можно использовать только клиенты из списка ниже: \n 🔐 Вот список поддерживаемых клиентов 🔧`,
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
          await ctx.editMessageText(
            `Мы еще не составили инструкций для *${currentOs.name}* 😟 \n Попробуйте погуглить, ${escapeMarkdownV2("что-то")} типа _VLess клиент для ${currentOs.key} инструкция_`,
            {
              parse_mode: "MarkdownV2",
              reply_markup: {
                inline_keyboard: [
                  [{ text: "Назад", callback_data: "back_to_start" }]
                ],
              }
            }
          );
        }
      } else if (callbackData.startsWith('client_')) {
        const clientKey = callbackData.replace('client_', '');
        const instruction = instructions.find(instr => instr.key === clientKey);
        if (instruction) {
          await ctx.editMessageText(
            `📌 **Инструкция для ${instruction.key}**\n\n${instruction.text}\n\n🔗 [Скачать](${instruction.downloadLink})`,
            { parse_mode: "Markdown" }
          );
        } else {
          await ctx.reply("⚠️ Ошибка выбора! Инструкция не найдена 😢");
        }
      }
    } catch (error) {
      console.error('Error in handleCallbackQuery:', error);
      await ctx.reply('Произошла ошибка при обработке команды');
    }
  }

  async showGuide(ctx: Context) {
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
    } catch (error) {
      console.error(error);
      await ctx.reply("Ошибка");
    }
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

      const expiryTime = (client as any).config.obj.expiryTime
        ? moment((client as any).config.obj.expiryTime).format("DD.MM.YYYY HH:mm")
        : "Не указано";

      const qrPath = `/tmp/qrcode_${client.name}.png`;

      await generateQrCode(client.vlessUrl, qrPath);

      if (!fs.existsSync(qrPath)) {
        console.log('QR code file not found');
        return ctx.reply('Ошибка при генерации QR-кода');
      }

      const caption = `*${escapeMarkdownV2(client.name)}*\n`
        + `⏳ *Дата окончания*: ${escapeMarkdownV2(expiryTime)}\n`
        + `🌎 *Локация*: ${countryToEmoji((client as any).location.country)} ${escapeMarkdownV2((client as any).location.country)} ${escapeMarkdownV2((client as any).location.city)}\n`
        + `🔑 *Ссылка для подключения*:\n`
        + `\`\`\`\n${escapeMarkdownV2(client.vlessUrl)}\n\`\`\``;

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

  async chooseLocation(ctx: Context) {
    const userId = ctx.chat.id;
    const locations = await this.apiService.getLocations();
    const data = (ctx as any).callbackQuery?.data;
    if (!data) return;
    const messageId = ctx.callbackQuery.message.message_id;
    const selectedLocation = locations.find(loc => `choose_location_${loc.id}` === data);
    if (!selectedLocation) return;

    let months = 1;
    let configName = `${ctx.from.username}-${Math.floor(Date.now() / 1000)}`;

    try {
      await ctx.deleteMessage(messageId);
    } catch (error) {
      console.error('Ошибка при удалении сообщения:', error);
    }

    if (this.isProd) {
      const paymentInfo = (ctx as any).session?.payment;

      if (!paymentInfo) {
        return await ctx.reply('⚠️ Оплата обязательна для использования сервиса.');
      }

      months = this.getSubscriptionLength(paymentInfo.invoice_payload);
      configName = `${paymentInfo}`;
      await ctx.reply('💸 Спасибо за оплату! 🙏');
    } else {
      await ctx.reply('⚠️ Тестовый режим активен. Оплата не требуется.');
    }

    await ctx.reply(`🔄 Генерируем подключение для сервера в ${selectedLocation.city}...`);

    const config = await this.apiService.createConfig({
      userId,
      months,
      name: configName,
      locationId: selectedLocation.id
    });

    if (config) {
      const qrPath = `/tmp/qrcode_${userId}.png`;

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
    } else {
      await ctx.reply('⚠️ Ошибка при генерации подключения. Свяжитесь с поддержкой.', {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🆘 Поддержка", url: this.supportUrl }, { text: "Инструкция по использованию VPN", callback_data: "guide" }]
          ]
        }
      });
    }
  }

  async openMenu(ctx: Context) {
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
