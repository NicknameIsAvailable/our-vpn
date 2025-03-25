/*
  Warnings:

  - You are about to drop the column `bandwidthLimit` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `currentLoad` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `hostname` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Location` table. All the data in the column will be lost.
  - Added the required column `coordinates` to the `Location` table without a default value. This is not possible if the table is not empty.
  - Added the required column `host` to the `Location` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `Location` table without a default value. This is not possible if the table is not empty.
  - Added the required column `port` to the `Location` table without a default value. This is not possible if the table is not empty.
  - Added the required column `url` to the `Location` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Location" DROP COLUMN "bandwidthLimit",
DROP COLUMN "createdAt",
DROP COLUMN "currentLoad",
DROP COLUMN "hostname",
DROP COLUMN "isActive",
DROP COLUMN "updatedAt",
ADD COLUMN     "coordinates" TEXT NOT NULL,
ADD COLUMN     "host" TEXT NOT NULL,
ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "port" INTEGER NOT NULL,
ADD COLUMN     "url" TEXT NOT NULL;
