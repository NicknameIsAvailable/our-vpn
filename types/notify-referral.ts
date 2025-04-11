import { PromoCode, TgUser } from "@prisma/client";

export interface NotifyReferralDtoInterface {
  referrerId: string;
  referral: TgUser;
  promoCode: PromoCode;
}