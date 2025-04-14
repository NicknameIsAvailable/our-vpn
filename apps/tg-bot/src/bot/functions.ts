import { countryToEmoji } from 'functions/country-to-emoji';
import { ApiService } from "../api/api.service";
import { Context, Telegraf } from 'telegraf';
import { Message, Update } from '@telegraf/types';
import { Config } from '@prisma/client';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { osList } from '../assets/assets';
import { MyContext } from '../types/my-context';
import { ReferralSystemService } from '../referral-system/referral-system.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class BotFunctions {
  private readonly supportUrl = process.env.TELEGRAM_SUPPORT_URL;

  constructor(
    @InjectBot() private bot: Telegraf<MyContext>,
    private readonly apiService: ApiService,
    private readonly subscriptionsService: SubscriptionsService,
    @Inject(forwardRef(() => ReferralSystemService))
    private readonly referralSystemService: ReferralSystemService
  ) {}

  botName = process.env.BOT_NAME;
  isProd = process.env.PRODUCTION === "true";

  async handleMenuButtonClick(ctx: Context<{
    message: Update.New & Update.NonChannel & Message.TextMessage;
    update_id: number;
  }>,
  ) {
    this.subscriptionsService.handleCancelPayment(ctx as MyContext);

    const text = ctx.message.text;

    if (text === "⚙ Получить ссылки для подключения" || text.includes("/connections")) {
      await this.getConfigs(ctx as any);
    }
    if (text === "🫂 Реферальная система" || text.includes("/referral")) {
      await this.referralSystemService.sendReferralSystemControlPanel(ctx as MyContext, null, true);
    }
    else if (text.includes("/menu")) {
      await this.openMenu(ctx as any)
    }
    else if (text === "💳 Подписка" || text.includes("/subscribe")) {
      await this.subscriptionsService.subscribeProposal(ctx as MyContext);
    }
    else if (text === "🆘 Поддержка") {
      await ctx.reply(`📞 Свяжись с поддержкой: ${this.supportUrl}`);
    }
    else if (text === "Инструкция по использованию VPN" || text.includes("/help")) {
      await this.showGuide(ctx as any);
    }
  }

  getConfigs = async (ctx: Context) => {
    const configs = await this.apiService.getUserConfigs(ctx as MyContext);

    if (configs.length === 0) {
      return ctx.reply(
        "✨ Похоже, у вас еще нет конфигов\\! 🚀 \n Ничего страшного\\! Вам нужно оформить подписку и мы всё сделаем\\! 💪",
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔥 Подписаться 💳", callback_data: "subscribe_command" }],
            ],
          },
        }
      );
    }

    const currentTime = Date.now();
    const buttons = configs.map((config: Config) => {
      const expiryTime = Number(config.expiryTime);
      const isExpired = expiryTime !== 0 && expiryTime < currentTime;
      const statusEmoji = isExpired ? "🔴" : "🟢";
      return [{
        text: `${statusEmoji} ${countryToEmoji((config as any).location.country)} ${(config as any).location.city} ${config.name}`,
        callback_data: `show_config_${config.id}`,
      }];
    });

    await ctx.reply("🔧 Ваши конфиги: \n", {
      reply_markup: { inline_keyboard: buttons },
    });
  };

  async showGuide(ctx: Context) {
    try {
      this.subscriptionsService.handleCancelPayment(ctx as MyContext);

      await ctx.reply("📖 Как пользоваться ВПН: \n Нужен гайд? Мы здесь, чтобы помочь\\! 💡");

      await ctx.reply("🖥️ Выберите свою ОС: \n Какие у тебя предпочтения? 🤔 Мы тебе поможем с настройкой\\! 🚀", {
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

  async getServers(ctx: Context<{
    message: Update.New & Update.NonChannel & Message.TextMessage;
    update_id: number;
  }>, apiService: ApiService) {
    try {
      this.subscriptionsService.handleCancelPayment(ctx as MyContext);

      const locations = await apiService.getLocations(ctx as MyContext);
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

  openMenu = async (ctx: Context) => {
    await ctx.reply("📋 Панель управления 💼 \n Ты в главном меню\\! 🔧", {
      reply_markup: {
        keyboard: [
          [{ text: "⚙ Получить ссылки для подключения" }],
          [{ text: "💳 Подписка" }, { text: "🫂 Реферальная система" }],
          [{ text: "🆘 Поддержка" }, { text: "Инструкция по использованию VPN" }]
        ],
        resize_keyboard: true,
        one_time_keyboard: false,
      },
    });
  }
}
