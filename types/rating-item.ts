import { Level, TgUser, User, UserProgress } from '@prisma/client';
export interface RatingItem extends Partial<TgUser> {
  id: TgUser["id"],
  username: TgUser["username"],
  referralCount: number,
  userProgress: {
    id: UserProgress["id"],
    currentLevel: Level,
    currentLevelId: UserProgress["currentLevelId"],
    created_at: UserProgress["created_at"],
    updated_at: UserProgress["updated_at"]
  }
  userProgressId: TgUser["userProgressId"],
  promoCodes: {
    referrals: User[]
  }[]
}
