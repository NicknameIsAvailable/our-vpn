import { PromoCode, TgUser } from "@prisma/client";
import { NotifyReferralDtoInterface } from "types/notify-referral";

export class NotifyReferralDto implements NotifyReferralDtoInterface {
  referrerId: string;
  referral: TgUser;
  promoCode: PromoCode;
}