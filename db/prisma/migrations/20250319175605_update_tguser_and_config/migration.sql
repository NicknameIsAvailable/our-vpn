/*
  Warnings:

  - You are about to drop the column `userId` on the `VlessConfig` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `VlessConfig` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "label" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "VlessConfig" DROP COLUMN "userId",
DROP COLUMN "username",
ADD COLUMN     "tgUserId" INTEGER;

-- CreateTable
CREATE TABLE "TgUser" (
    "id" INTEGER NOT NULL,
    "username" TEXT NOT NULL DEFAULT 'anon',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "TgUser_id_key" ON "TgUser"("id");

-- AddForeignKey
ALTER TABLE "VlessConfig" ADD CONSTRAINT "VlessConfig_tgUserId_fkey" FOREIGN KEY ("tgUserId") REFERENCES "TgUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
