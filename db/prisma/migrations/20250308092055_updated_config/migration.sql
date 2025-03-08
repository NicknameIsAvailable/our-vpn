-- DropForeignKey
ALTER TABLE "VlessConfig" DROP CONSTRAINT "VlessConfig_promoCodeId_fkey";

-- AlterTable
ALTER TABLE "VlessConfig" ALTER COLUMN "promoCodeId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "VlessConfig" ADD CONSTRAINT "VlessConfig_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
