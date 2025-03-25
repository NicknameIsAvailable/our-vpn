-- AlterTable
ALTER TABLE "VlessConfig" ADD COLUMN     "paymentId" TEXT DEFAULT '',
ALTER COLUMN "price" SET DEFAULT 0;
