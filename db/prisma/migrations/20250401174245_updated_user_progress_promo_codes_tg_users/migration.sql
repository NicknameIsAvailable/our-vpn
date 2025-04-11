/*
  Warnings:

  - You are about to drop the column `referrerId` on the `PromoCode` table. All the data in the column will be lost.
  - You are about to drop the column `userProgressId` on the `PromoCode` table. All the data in the column will be lost.
  - You are about to drop the `_ReferralsPromoCodes` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[promoCodeId]` on the table `TgUser` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "PromoCode" DROP CONSTRAINT "PromoCode_userProgressId_fkey";

-- DropForeignKey
ALTER TABLE "_ReferralsPromoCodes" DROP CONSTRAINT "_ReferralsPromoCodes_A_fkey";

-- DropForeignKey
ALTER TABLE "_ReferralsPromoCodes" DROP CONSTRAINT "_ReferralsPromoCodes_B_fkey";

-- DropIndex
DROP INDEX "PromoCode_referrerId_key";

-- AlterTable
ALTER TABLE "PromoCode" DROP COLUMN "referrerId",
DROP COLUMN "userProgressId";

-- AlterTable
ALTER TABLE "TgUser" ADD COLUMN     "promoCodeId" TEXT;

-- DropTable
DROP TABLE "_ReferralsPromoCodes";

-- CreateTable
CREATE TABLE "_UsedPromoCodes" (
    "A" TEXT NOT NULL,
    "B" BIGINT NOT NULL,

    CONSTRAINT "_UsedPromoCodes_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_UsedPromoCodes_B_index" ON "_UsedPromoCodes"("B");

-- CreateIndex
CREATE UNIQUE INDEX "TgUser_promoCodeId_key" ON "TgUser"("promoCodeId");

-- AddForeignKey
ALTER TABLE "TgUser" ADD CONSTRAINT "TgUser_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoCode" ADD CONSTRAINT "PromoCode_referrerProgressId_fkey" FOREIGN KEY ("referrerProgressId") REFERENCES "UserProgress"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UsedPromoCodes" ADD CONSTRAINT "_UsedPromoCodes_A_fkey" FOREIGN KEY ("A") REFERENCES "PromoCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UsedPromoCodes" ADD CONSTRAINT "_UsedPromoCodes_B_fkey" FOREIGN KEY ("B") REFERENCES "TgUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
