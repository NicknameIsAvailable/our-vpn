/*
  Warnings:

  - You are about to drop the column `address` on the `VlessConfig` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `VlessConfig` table. All the data in the column will be lost.
  - You are about to drop the column `network` on the `VlessConfig` table. All the data in the column will be lost.
  - You are about to drop the column `path` on the `VlessConfig` table. All the data in the column will be lost.
  - You are about to drop the column `port` on the `VlessConfig` table. All the data in the column will be lost.
  - You are about to drop the column `remark` on the `VlessConfig` table. All the data in the column will be lost.
  - You are about to drop the column `security` on the `VlessConfig` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `VlessConfig` table. All the data in the column will be lost.
  - You are about to drop the column `uuid` on the `VlessConfig` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "VlessConfig_uuid_key";

-- AlterTable
ALTER TABLE "VlessConfig" DROP COLUMN "address",
DROP COLUMN "createdAt",
DROP COLUMN "network",
DROP COLUMN "path",
DROP COLUMN "port",
DROP COLUMN "remark",
DROP COLUMN "security",
DROP COLUMN "updatedAt",
DROP COLUMN "uuid";
