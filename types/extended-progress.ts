import { Level, TgUser, UserProgress } from "@prisma/client";

export interface ExtendedUserProgress extends UserProgress {
  tgUser: TgUser,
  currentLevel: Level,
  referrals: TgUser[],
  referralCount: number,
}
