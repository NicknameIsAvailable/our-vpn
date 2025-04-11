import { PromoCode, PromoCodeType } from "@prisma/client";

export class CreatePromoCodeDto implements Partial<PromoCode> {
  code?: string;
  name: string;
  type?: PromoCodeType;
  description: string;
  discountPercent: number;
  bonusDays: number;
  usesCount: number;
}
