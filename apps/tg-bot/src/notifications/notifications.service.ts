import { Injectable } from '@nestjs/common';
import { NotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { MyContext } from '../types/my-context';
import { NotifyReferralDto } from './dto/notify-referral';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectBot() private readonly bot: Telegraf<MyContext>
  ) {}
  async notifyUsers(message: string, userIds?: string[]) {
    try {
      console.log({ message, userIds })

      if (userIds && userIds.length > 0) {
        for (const userId of userIds) {
          try {
            return await this.bot.telegram.sendMessage(userId, message, { parse_mode: 'MarkdownV2' });
          } catch (error) {
            console.error(`Failed to send notification to user ${userId}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error sending notifications:', error);
      throw error;
    }
  }

  async notifyReferral(notifyReferralDto: NotifyReferralDto) {
    const discountBonus = notifyReferralDto.promoCode.discountPercent && notifyReferralDto.promoCode.discountPercent !== 0
      ? `${notifyReferralDto.promoCode.discountPercent}% скидки на все следующие покупки`
      : null;

    const referralBonus = notifyReferralDto.promoCode.bonusDays && notifyReferralDto.promoCode.bonusDays !== 0
      ? `${notifyReferralDto.promoCode.bonusDays} дополнительных дней подписки`
      : null;

    const hasBonus = discountBonus || referralBonus;

    const message = `
🎉 *Ура\\! У вас новый реферал\\!* 🎉

👤 *${notifyReferralDto.referral.username}* присоединился к нам, используя ваш промокод \\(*${notifyReferralDto.promoCode.code}*\\)\\!

${hasBonus ? "🎁 *Ваши бонусы:*" : ""}
${discountBonus ? `✨ ${discountBonus}` : ''}
${referralBonus ? `✨ ${referralBonus}` : ''}

Спасибо, что помогаете нам расти\\! 🌱
`;

    console.log({ message })

    return this.notifyUsers(message, [notifyReferralDto.referrerId]);
  }
}
