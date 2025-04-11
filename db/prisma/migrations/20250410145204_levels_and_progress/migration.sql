/*
  Warnings:

  - Added the required column `referralDiscountPercent` to the `Level` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Level" ADD COLUMN     "referralDiscountPercent" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "UserProgress" ADD COLUMN     "accumulatedDays" INTEGER NOT NULL DEFAULT 0;
