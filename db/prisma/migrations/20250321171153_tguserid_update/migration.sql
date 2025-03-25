-- DropForeignKey
ALTER TABLE "VlessConfig" DROP CONSTRAINT "VlessConfig_tgUserId_fkey";

-- AlterTable
ALTER TABLE "TgUser" ALTER COLUMN "id" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "VlessConfig" ALTER COLUMN "tgUserId" SET DATA TYPE BIGINT;

-- AddForeignKey
ALTER TABLE "VlessConfig" ADD CONSTRAINT "VlessConfig_tgUserId_fkey" FOREIGN KEY ("tgUserId") REFERENCES "TgUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
