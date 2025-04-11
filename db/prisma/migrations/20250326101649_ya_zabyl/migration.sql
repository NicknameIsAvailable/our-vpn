/*
  Warnings:

  - Added the required column `bonusDays` to the `PromoCode` table without a default value. This is not possible if the table is not empty.
  - Added the required column `referrerProgressId` to the `PromoCode` table without a default value. This is not possible if the table is not empty.
  - Added the required column `url` to the `PromoCode` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userProgressId` to the `PromoCode` table without a default value. This is not possible if the table is not empty.
  - Added the required column `usesCount` to the `PromoCode` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PromoCodeType" AS ENUM ('REFERRAL', 'COMMERCIAL');

-- DropForeignKey
ALTER TABLE "UserProgress" DROP CONSTRAINT "UserProgress_tgUserId_fkey";

-- AlterTable
ALTER TABLE "PromoCode" ADD COLUMN     "bonusDays" INTEGER NOT NULL,
ADD COLUMN     "referrerId" INTEGER,
ADD COLUMN     "referrerProgressId" TEXT NOT NULL,
ADD COLUMN     "type" "PromoCodeType" NOT NULL DEFAULT 'REFERRAL',
ADD COLUMN     "url" TEXT NOT NULL,
ADD COLUMN     "userProgressId" TEXT NOT NULL,
ADD COLUMN     "usesCount" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "UserProgress" ALTER COLUMN "tgUserId" SET DATA TYPE BIGINT;

-- CreateTable
CREATE TABLE "_ReferralsPromoCodes" (
    "A" TEXT NOT NULL,
    "B" BIGINT NOT NULL,

    CONSTRAINT "_ReferralsPromoCodes_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ReferralsPromoCodes_B_index" ON "_ReferralsPromoCodes"("B");

-- AddForeignKey
ALTER TABLE "UserProgress" ADD CONSTRAINT "UserProgress_tgUserId_fkey" FOREIGN KEY ("tgUserId") REFERENCES "TgUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoCode" ADD CONSTRAINT "PromoCode_userProgressId_fkey" FOREIGN KEY ("userProgressId") REFERENCES "UserProgress"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ReferralsPromoCodes" ADD CONSTRAINT "_ReferralsPromoCodes_A_fkey" FOREIGN KEY ("A") REFERENCES "PromoCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ReferralsPromoCodes" ADD CONSTRAINT "_ReferralsPromoCodes_B_fkey" FOREIGN KEY ("B") REFERENCES "TgUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
