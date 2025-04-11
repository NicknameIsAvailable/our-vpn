import { PromoCode } from "@prisma/client";

export interface TgUserFullData {
  id: string;
    userProgress: {
        id: string;
        created_at: Date;
        updated_at: Date;
        currentLevelId: string;
        tgUserId: bigint;
    };
    referringProgress: {
        id: string;
        created_at: Date;
        updated_at: Date;
        currentLevelId: string;
        tgUserId: bigint;
    };
    username: string;
    userProgressId: string | null;
    created_at: Date;
    updated_at: Date;
    usedPromoCodes: PromoCode[];
    savedPromoCodes: PromoCode[];
}
