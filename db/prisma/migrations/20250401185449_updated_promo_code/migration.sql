/*
  Warnings:

  - You are about to drop the column `promoCodeId` on the `TgUser` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[ownerId]` on the table `PromoCode` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "TgUser" DROP CONSTRAINT "TgUser_promoCodeId_fkey";

-- DropIndex
DROP INDEX "TgUser_promoCodeId_key";

-- AlterTable
ALTER TABLE "PromoCode" ADD COLUMN     "ownerId" BIGINT;

-- AlterTable
ALTER TABLE "TgUser" DROP COLUMN "promoCodeId";

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_ownerId_key" ON "PromoCode"("ownerId");

-- AddForeignKey
ALTER TABLE "PromoCode" ADD CONSTRAINT "PromoCode_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "TgUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
