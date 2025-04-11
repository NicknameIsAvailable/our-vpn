import { PromoCode, TgUser, UserProgress } from "@prisma/client";

export interface PromoCodeExtended extends PromoCode {
  users: TgUser[];
  savedByUsers: TgUser[];
  referrerProgress: UserProgress;
  owner: TgUser
}
