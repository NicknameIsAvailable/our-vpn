import { escapeMarkdownV2 } from './../utils/escape-markdown';
import { Injectable } from '@nestjs/common';
import { MyContext } from '../types/my-context';
import { ApiService } from '../api/api.service';
import { ExtendedUserProgress } from 'types/extended-progress';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { BotFunctions } from '../bot/functions';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
@Injectable()
export class ReferralSystemService {
  constructor(
    private readonly apiService: ApiService,
    @InjectBot() private readonly bot: Telegraf<MyContext>,
    private readonly botFunctions: BotFunctions,
    private readonly subscriptionsService: SubscriptionsService
  ) {}

  async handleCallbackData(ctx: MyContext) {
    const callbackData = (ctx.callbackQuery as any).data;

    if (callbackData.startsWith('level_')) {
        await this.viewLevelById(ctx);
        return;
    }

    if (callbackData.startsWith('user_')) {
      await this.sendUserProgress(ctx);
      return;
    }

    if (callbackData.startsWith('promo_')) {
      await this.viewPromoCodeDetails(ctx);
      return;
    }

    if (callbackData.startsWith('saved_promos_page_')) {
      await this.viewSavedPromoCodes(ctx);
      return;
    }

    switch (callbackData) {
      case 'referral-system':
        this.sendReferralSystemControlPanel(ctx);
        break;
      case 'invite':
        this.sendInvite(ctx)
        break;
      case 'view_rating':
        await this.sendRating(ctx as MyContext);
        break;
      case 'view_levels':
        await this.viewLevels(ctx as MyContext);
        break;
      case 'join_referral':
        await this.sendCreateReferralSystem(ctx as MyContext);
        break;
      case 'decline_referral':
        await this.declineReferral(ctx as MyContext);
        break;
      case 'super_decline_referral':
        await this.superDeclineReferral(ctx as MyContext);
        break;
      case 'view_saved_promos':
        await this.viewSavedPromoCodes(ctx);
        break;
      case 'use_saved_promo':
        await this.viewSavedPromoCodes(ctx);
        break;
      case 'enter_promo':
        await ctx.editMessageText("Введите промокод в чат:", {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔙 Назад", callback_data: "skip_promo" }]
            ]
          }
        });
        ctx.session = {
          ...ctx.session,
          waitingForPromoCode: true
        };
        break;
      case 'skip_promo':
        // This will be handled by the bot service
        break;
      default:
        // Don't show error for unknown buttons, just ignore them
        break;
    }
  }

  async sendCreateReferralSystemProposal(ctx: MyContext) {
    const message = `
🎯 *Добро пожаловать в реферальную программу\\!* 🎯

Приглашайте друзей и получайте крутые бонусы:

• 🚀 Многоуровневая система — чем больше друзей, тем выше уровень
• 🎁 Бонусы на каждом этапе — дни подписки и скидки на VPN
• 💎 Статус среди друзей — вы знаете о лучших сервисах

Присоединяйтесь прямо сейчас\\! 👇
    `;

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🚀 Вступить в программу", callback_data: "join_referral" }],
          [{ text: "❌ Отказаться", callback_data: "decline_referral" }]
        ]
      }
    };

    ctx.reply(message, { parse_mode: "MarkdownV2", ...keyboard });
  }

  async sendCreateReferralSystem(ctx: MyContext) {
    const loadingMessages = [
      "🔄 Регистрация в реферальной программе",
      "🔄 Регистрация в реферальной программе.",
      "🔄 Регистрация в реферальной программе..",
      "🔄 Регистрация в реферальной программе..."
    ];
    let i = 0;

    const message = await ctx.reply(loadingMessages[i]);

    const interval = setInterval(async () => {
      i = (i + 1) % loadingMessages.length;
      try {
        await ctx.telegram.editMessageText(ctx.chat.id, message.message_id, undefined, loadingMessages[i]);
      } catch (error) {
        clearInterval(interval);
      }
    }, 500);

    try {
      const data = await this.apiService.createUserProgress(ctx);

      clearInterval(interval);

      await ctx.telegram.editMessageText(ctx.chat.id, message.message_id, undefined, "✨ Регистрация успешно завершена\\!Добро пожаловать в реферальную программу\\!🚀");

      await this.sendReferralSystemControlPanel(ctx, data);
    } catch (error) {
      clearInterval(interval);
      await ctx.telegram.editMessageText(ctx.chat.id, message.message_id, undefined, "❌ Произошла ошибка при регистрации. Попробуйте позже.");
    }
  }

  async declineReferral(ctx: MyContext) {
    ctx.editMessageText("Вы уверены, что хотите отказаться от бонусов? 🤔", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "✨ Да, давайте присоединимся", callback_data: "join_referral" }],
          [{ text: "❌ Нет, отказываюсь", callback_data: "super_decline_referral" }]
        ],
      }
    })
  }

  async superDeclineReferral(ctx: MyContext) {
    ctx.editMessageText("Жаль, что вы отказались от бонусов 😔\n\nЕсли передумаете, мы всегда рады видеть вас снова\\!🌟")
  }

  async sendReferralSystemControlPanel(ctx: MyContext, initialData?: ExtendedUserProgress, newMessage?: boolean) {
    const data = initialData ?? await this.apiService.getMyProgress(ctx);

    if (!data) {
      this.sendCreateReferralSystemProposal(ctx)
      return;
    }

    const newData = await this.apiService.upgradeLevel(ctx);

    const { currentLevel } = newData;

    const message = `
📢 *Реферальная система*
🏆 Текущий уровень: *${escapeMarkdownV2(currentLevel.label)}*
👥 Пригласите *${escapeMarkdownV2(String(data.referralCount || 0))}/${escapeMarkdownV2(String(currentLevel.usersCount))}* друзей и перейдите на следующий уровень

🎁 Бонусы следующего уровня:
${currentLevel.instantBonusDays ? `\\- *${escapeMarkdownV2(String(currentLevel.instantBonusDays))} дней* подписки сразу` : ""}
${currentLevel.constantBonusDays ? `\\- *${escapeMarkdownV2(String(currentLevel.constantBonusDays))} дней* подписки за каждого нового приглашенного друга` : ""}
${currentLevel.constantBonusDiscount ? `\\- *${escapeMarkdownV2(String(currentLevel.constantBonusDiscount))}%* скидка на все следующие покупки в нашем сервисе` : ""}

🚀 Приглашайте друзей и повышайте уровень\\!
    `;

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🎉 Пригласить друга 🚀",
              callback_data: "invite"
            }
          ],
          [
            {
              text: "📊 Рейтинг рефералов",
              callback_data: "view_rating"
            },
            {
              text: "📜 Посмотреть уровни",
              callback_data: "view_levels"
            }
          ],
          [
            {
              text: "🎟 Мои промокоды",
              callback_data: "view_saved_promos"
            }
          ]
        ]
      }
    }

    if (newMessage)
      ctx.reply(message, {
        parse_mode: "MarkdownV2",
        ...keyboard
      });
    else
      ctx.editMessageText(message, {
        parse_mode: "MarkdownV2",
        ...keyboard
      });
  }

  menuButton = {
    text: "В меню",
    callback_data: "referral-system"
  }

  async sendRating(ctx: MyContext, newMessage?: boolean) {
    try {
      const data = await this.apiService.getReferralSystemRating(ctx);

      if (!data || data.length === 0) {
        ctx.reply('❌ Нет данных о рефералах.');
        return;
      }

      const keyboard = {
        reply_markup: {
          inline_keyboard: [
            ...data.slice(0, 9).map(user => [
              {
                text: `🏅 ${escapeMarkdownV2(user.username)} (${user.referralCount} реф.)`,
                callback_data: `user_${user.userProgress.id}`
              }
            ]),
            [this.menuButton]
          ]
        }
      };

      if (newMessage)
        ctx.reply('📊 *Рейтинг рефералов*:', { parse_mode: "MarkdownV2", ...keyboard });
      else
        ctx.editMessageText('📊 *Рейтинг рефералов*:', { parse_mode: "MarkdownV2", ...keyboard });
    } catch (e) {
      console.log(e)
    }
  }

  async sendUserProgress(ctx: MyContext, newMessage?: boolean) {
    const callbackData = (ctx.callbackQuery as any).data;
    const userProgressId = callbackData.replace('user_', '');

    const userProgress = await this.apiService.getUserProgressById(ctx, userProgressId);

    if (!userProgress) {
      ctx.reply('❌ Реферрер не найден\\.', { parse_mode: 'MarkdownV2' });
      return;
    }

    const message = `
🏅 *Профиль реферала: ${escapeMarkdownV2(userProgress.tgUser.username)}*
👥 Приглашено друзей: *${escapeMarkdownV2(String(userProgress.referralCount ?? 0))}*
🎖 Уровень: *${escapeMarkdownV2(userProgress.currentLevel.label)}*

🎁 Бонусы:
${userProgress.currentLevel.instantBonusDays ? `\\- *${escapeMarkdownV2(String(userProgress.currentLevel.instantBonusDays))} дней* подписки сразу` : ""}
${userProgress.currentLevel.constantBonusDays ? `\\- *${escapeMarkdownV2(String(userProgress.currentLevel.constantBonusDays))} дней* подписки за каждого друга` : ""}
${userProgress.currentLevel.constantBonusDiscount ? `\\- *${escapeMarkdownV2(String(userProgress.currentLevel.constantBonusDiscount))}%* скидка на следующие покупки` : ""}
    `;

    const keyboard = {
      reply_markup: {
        inline_keyboard: [[{ text: "🔙 Назад", callback_data: "view_rating" }]]
      }
    };

    if (newMessage)
      ctx.reply(message, { parse_mode: "MarkdownV2", ...keyboard });
    else
      ctx.editMessageText(message, { parse_mode: "MarkdownV2", ...keyboard });
  }

  async viewLevels(ctx: MyContext, newMessage?: boolean) {
    const levels = await this.apiService.getLevels(ctx);

    if (!levels || levels.length === 0) {
        ctx.reply('❌ Уровни не найдены\\.', { parse_mode: 'MarkdownV2' });
        return;
    }

    const keyboard = {
        reply_markup: {
            inline_keyboard: [
            ...levels.map(level => [
                  {
                      text: `${level.label} (${level.usersCount} чел.)`,
                      callback_data: `level_${level.id}`
                  },
              ],
            ),
            [this.menuButton]
          ]
        }
    };

    if (newMessage)
        ctx.reply('📜 *Доступные уровни:*', { parse_mode: 'MarkdownV2', ...keyboard });
    else
        ctx.editMessageText('📜 *Доступные уровни:*', { parse_mode: 'MarkdownV2', ...keyboard });
  }

  async viewLevelById(ctx: MyContext, newMessage?: boolean) {
    const callbackData = (ctx.callbackQuery as any).data;
    const levelId = callbackData.replace('level_', '');

    const level = await this.apiService.getLevelById(ctx, levelId);

    if (!level) {
        ctx.reply('❌ Уровень не найден\\.', { parse_mode: 'MarkdownV2' });
        return;
    }

    const message = `
🏆 *${escapeMarkdownV2(level.label)}*
👥 Требуется рефералов: *${escapeMarkdownV2(String(level.usersCount))}*
🎁 Бонусы:
${level.instantBonusDays ? `\\- *${escapeMarkdownV2(String(level.instantBonusDays))} дней* подписки сразу` : ""}
${level.constantBonusDays ? `\\- *${escapeMarkdownV2(String(level.constantBonusDays))} дней* подписки за каждого нового приглашенного друга` : ""}
${level.constantBonusDiscount ? `\\- *${escapeMarkdownV2(String(level.constantBonusDiscount))}%* скидка на все следующие покупки` : ""}
    `;

    const keyboard = {
        reply_markup: {
            inline_keyboard: [
                [{ text: "Назад", callback_data: "view_levels" }],
                [this.menuButton]
            ]
        }
    };

    if (newMessage)
        ctx.reply(message, { parse_mode: "MarkdownV2", ...keyboard });
    else
        ctx.editMessageText(message, { parse_mode: "MarkdownV2", ...keyboard });
  }

  async sendInvite(ctx: MyContext, newMessage?: boolean) {
    let data = await this.apiService.getMyPromoCode(ctx);

    if (!data) {
      await ctx.editMessageText("🔄 Генерирую вашу реферальную ссылку...");
      data = await this.apiService.createMyPromoCode(ctx);
    }

    const message = `
🎯 *Ваш реферальный промокод готов\\!*

📝 *Код:* \`${data.code}\`
🔗 *Ссылка:* [тык сюда](${data.url})

🎁 *Бонусы:*
• ${data.bonusDays} дней подписки за активацию
• ${data.referralDiscountPercent}% скидка для рефералов
• ${data.usesCount} использований осталось

*Поделитесь с друзьями и получайте бонусы\\!* 🚀
    `;

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "📤 Поделиться",
              switch_inline_query: `Привет! Подключайся к нашему VPN, вот промокод: <a href="${data.url}">${data.code}</a>`,
              parse_mode: "HTML"
            }
          ],
          [this.menuButton]
        ]
      }
    };

    if (newMessage) {
      ctx.reply(message, { parse_mode: "MarkdownV2", ...keyboard });
    } else {
      ctx.editMessageText(message, { parse_mode: "MarkdownV2", ...keyboard });
    }
  }

  async savePromoCode(ctx: MyContext, code: string) {
    const message = await ctx.reply("🔃 Проверяю промокод...");

    const promoCodeData = await this.apiService.getPromoCodeByCode(ctx, code);
    if (!promoCodeData) {
        return ctx.editMessageText("❌ Промокод не найден").catch(() => ctx.reply("❌ Промокод не найден"));
    }

    const userData = await this.apiService.getUserData(ctx);
    if (userData.savedPromoCodes.some(promo => promo.id === promoCodeData.id)) {
        return ctx.editMessageText("❌ Вы уже сохраняли этот промокод ранее").catch(() => ctx.reply("❌ Вы уже сохраняли этот промокод ранее"));
    }

    if (userData.usedPromoCodes.some(promo => promo.id === promoCodeData.id)) {
        return ctx.editMessageText("❌ Вы уже использовали этот промокод ранее").catch(() => ctx.reply("❌ Вы уже использовали этот промокод ранее"));
    }

    await ctx.editMessageText(`✅ Промокод найден\\!
Код: ${promoCodeData.code}
${promoCodeData.description}
Использован ${promoCodeData.users.length} раз из ${promoCodeData.usesCount}`).catch(() => ctx.reply(`✅ Промокод найден\\!
Код: ${promoCodeData.code}
${promoCodeData.description}
Использован ${promoCodeData.users.length} раз из ${promoCodeData.usesCount}`, {parse_mode: "MarkdownV2"}));

    await ctx.reply("🔃 Сохраняю промокод...");

    const data = await this.apiService.savePromoCode(ctx, promoCodeData.id);

    if (data) {
        return ctx.reply(`✅ Промокод ${promoCodeData.code} сохранен! Вы можете использовать его при следующей покупке 👇`, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🔥 Подписаться 💳", callback_data: "subscribe_command" }],
                ],
            }
        });
    } else {
        return ctx.reply("❌ Не удалось сохранить промокод");
    }
  }

  async viewSavedPromoCodes(ctx: MyContext, newMessage?: boolean) {
    const callbackData = (ctx.callbackQuery as any).data;
    const pageMatch = callbackData?.match(/saved_promos_page_(\d+)/);
    const page = pageMatch ? parseInt(pageMatch[1]) : 1;
    const pageSize = 5;

    try {
      const userData = await this.apiService.getUserData(ctx);

      if (!userData.savedPromoCodes || userData.savedPromoCodes.length === 0) {
        const message = "У вас нет сохраненных промокодов\\.";
        const keyboard = {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🔙 Назад", callback_data: "referral-system" }]
            ]
          }
        };

        if (newMessage) {
          ctx.reply(message, { parse_mode: "MarkdownV2", ...keyboard });
        } else {
          ctx.editMessageText(message, { parse_mode: "MarkdownV2", ...keyboard });
        }
        return;
      }

      const totalPages = Math.ceil(userData.savedPromoCodes.length / pageSize);
      const startIndex = (page - 1) * pageSize;
      const endIndex = Math.min(startIndex + pageSize, userData.savedPromoCodes.length);
      const currentPagePromos = userData.savedPromoCodes.slice(startIndex, endIndex);

      const message = `📋 *Ваши сохраненные промокоды* \\(стр\\. ${escapeMarkdownV2(String(page))} из ${escapeMarkdownV2(String(totalPages))}\\):`;

      const keyboard = {
        reply_markup: {
          inline_keyboard: [
            ...currentPagePromos.map(promo => [
              {
                text: `🎟 ${escapeMarkdownV2(promo.name)}`,
                callback_data: `promo_${promo.id}`
              }
            ]),
            []
          ]
        }
      };

      if (totalPages > 1) {
        const paginationRow = [];

        if (page > 1) {
          paginationRow.push({
            text: "⬅️",
            callback_data: `saved_promos_page_${page - 1}`
          });
        }

        if (page < totalPages) {
          paginationRow.push({
            text: "➡️",
            callback_data: `saved_promos_page_${page + 1}`
          });
        }

        if (paginationRow.length > 0) {
          keyboard.reply_markup.inline_keyboard.push(paginationRow);
        }
      }

      keyboard.reply_markup.inline_keyboard.push([
        { text: "🔙 Назад", callback_data: "referral-system" }
      ]);

      if (newMessage) {
        ctx.reply(message, { parse_mode: "MarkdownV2", ...keyboard });
      } else {
        const currentMessage = (ctx.update as any).callback_query?.message;
        const oldText = currentMessage?.text;
        const oldMarkup = currentMessage?.reply_markup;
        const newMarkup = keyboard.reply_markup;

        const isSameText = oldText === message;
        const isSameMarkup = JSON.stringify(oldMarkup) === JSON.stringify(newMarkup);

        if (isSameText && isSameMarkup) {
          return;
        }

        ctx.editMessageText(message, { parse_mode: "MarkdownV2", ...keyboard });
      }
    } catch (error) {
      console.error('Error displaying saved promo codes:', error);
      const errorMessage = "❌ Произошла ошибка при загрузке промокодов\\.";

      if (newMessage) {
        ctx.reply(errorMessage, { parse_mode: "MarkdownV2" });
      } else {
        ctx.editMessageText(errorMessage, { parse_mode: "MarkdownV2" });
      }
    }
  }

  async viewPromoCodeDetails(ctx: MyContext) {
    const callbackData = (ctx.callbackQuery as any).data;
    const promoId = callbackData.replace('promo_', '');

    try {
      const userData = await this.apiService.getUserData(ctx);
      const promoCode = userData.savedPromoCodes.find(promo => promo.id === promoId);

      if (!promoCode) {
        ctx.editMessageText("❌ Промокод не найден\\.", { parse_mode: "MarkdownV2" });
        return;
      }

      const message = `
🎟 *Информация о промокоде*

*Код:* ${escapeMarkdownV2(promoCode.code)}
*Название:* ${escapeMarkdownV2(promoCode.name)}
*Скидка:* ${escapeMarkdownV2(String(promoCode.referralDiscountPercent))}%
*Бонусные дни:* ${escapeMarkdownV2(String(promoCode.bonusDays))}
*Использований:* ${escapeMarkdownV2(String(promoCode.usesCount))}
*Ссылка:* [тык сюда](${escapeMarkdownV2(promoCode.url)})
      `;

      const keyboard = {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔙 Назад к списку", callback_data: "view_saved_promos" }],
            [{ text: "✅ Использовать этот промокод", callback_data: `use_promo_${promoCode.id}` }]
          ]
        }
      };

      ctx.editMessageText(message, {
        parse_mode: "MarkdownV2",
        link_preview_options: { is_disabled: true },
        ...keyboard
      });
    } catch (error) {
      console.error('Error displaying promo code details:', error);
      ctx.editMessageText("❌ Произошла ошибка при загрузке информации о промокоде", { parse_mode: "MarkdownV2" });
    }
  }

  async usePromoCode(ctx: MyContext, callbackData: string) {
    const promoCodeId = callbackData.replace('use_promo_', '');

    const promoCode = await this.apiService.getPromoCodeById(ctx, promoCodeId);
    if (!promoCode) {
      return ctx.editMessageText("❌ Промокод не выбран\\.", { parse_mode: "MarkdownV2" });
    }

    if (!ctx.session.location) {
      this.bot.telegram.sendMessage(ctx.chat.id, "🔄 Выберите локацию для использования промокода");
      return;
    }

    this.bot.telegram.sendMessage(ctx.chat.id, "🔃 Обрабатываю платеж...");

    const data = await this.apiService.savePromoCode(ctx, promoCode.id);

    if (data) {
        return ctx.reply(`✅ Промокод ${promoCode.code} сохранен! Вы можете использовать его при следующей покупке 👇`, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🔥 Подписаться 💳", callback_data: "subscribe_command" }],
                ],
            }
        });
    } else {
        return ctx.reply("❌ Не удалось сохранить промокод");
    }
  }

  async handleUsePromoCode(ctx: MyContext, callbackData: string) {
    const promoCodeId = callbackData.replace('use_promo_', '');

    const promoCode = await this.apiService.getPromoCodeById(ctx, promoCodeId);

    ctx.session = {
      ...ctx.session,
      selectedPromoCode: promoCode
    };

    if (!promoCode) {
      return ctx.editMessageText("❌ Промокод не выбран\\.", { parse_mode: "MarkdownV2" });
    }

    this.subscriptionsService.showSubscriptionOptions(ctx);
  }
}
