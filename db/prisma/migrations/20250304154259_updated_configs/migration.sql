/*
  Warnings:

  - Added the required column `locationId` to the `VlessConfig` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "VlessConfig" ADD COLUMN     "locationId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "VlessConfig" ADD CONSTRAINT "VlessConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VlessConfig" ADD CONSTRAINT "VlessConfig_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
