import { countryToEmoji } from 'functions/country-to-emoji';
import moment from "moment";
import { ApiService } from "../api/api.service";
import { Context } from 'telegraf';
import { Message, Update } from '@telegraf/types';

export const escapeMarkdownV2 = (text: string) => {
  return text.replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1');
};

export const getConfigs = async (ctx, apiService) => {
  const {chat} = ctx
  const configs = await apiService.getUserConfigs(String(chat.id))
  if (configs.length === 0) {
    ctx.reply("✨ Похоже, у вас еще нет конфигов! 🚀 \n Ничего страшного! Вам нужно оформить подписку и мы всё сделаем! 💪", {
      reply_markup: {
        inline_keyboard: [
          [{
            text: "🔥 Подписаться 💳",
            callback_data: "subscribe_command"
          }]
        ]
      }
    })
  }

  const formattedConfigs = configs.map(config => {
    const parsedConfig = typeof config.config === "string" ? JSON.parse(config.config) : config.config;
    const expiryTime = parsedConfig?.expiryTime
      ? moment(parsedConfig.expiryTime).format("DD.MM.YYYY HH:mm")
      : "Не указано";

      return `*${escapeMarkdownV2(config.name)}*
      ⏳ *Дата окончания*: ${escapeMarkdownV2(expiryTime)}
      🔑 *Ссылка для подключения*:

      ||\`\`\`
      ${escapeMarkdownV2(config.vlessUrl)}
      \`\`\`||`
  });

  if (formattedConfigs.length > 0) {
    await ctx.reply("🔧 Ваши конфиги: \n 🎯 Все на месте, не переживай, брат! 👌");
    formattedConfigs.forEach(async config => await ctx.reply(config, { parse_mode: "MarkdownV2" }));
  }
}

export async function getServers(ctx: Context<{
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
