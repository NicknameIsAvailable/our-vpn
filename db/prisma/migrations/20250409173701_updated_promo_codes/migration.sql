/*
  Warnings:

  - Added the required column `referralBonusDays` to the `PromoCode` table without a default value. This is not possible if the table is not empty.
  - Added the required column `referralDiscountPercent` to the `PromoCode` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PromoCode" ADD COLUMN     "referralBonusDays" INTEGER NOT NULL,
ADD COLUMN     "referralDiscountPercent" INTEGER NOT NULL;
