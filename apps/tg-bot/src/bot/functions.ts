import moment from "moment";

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
