/*
  Warnings:

  - Added the required column `price` to the `VlessConfig` table without a default value. This is not possible if the table is not empty.
  - Added the required column `promoCodeId` to the `VlessConfig` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `VlessConfig` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "VlessConfig" ADD COLUMN     "price" INTEGER NOT NULL,
ADD COLUMN     "promoCodeId" TEXT NOT NULL,
ADD COLUMN     "username" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "VlessConfig" ADD CONSTRAINT "VlessConfig_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
