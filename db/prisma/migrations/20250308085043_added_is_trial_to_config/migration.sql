/*
  Warnings:

  - Added the required column `isTrial` to the `VlessConfig` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "VlessConfig" ADD COLUMN     "isTrial" BOOLEAN NOT NULL;
