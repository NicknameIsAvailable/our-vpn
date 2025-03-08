/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `PromoCode` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `PromoCode` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PromoCode" ADD COLUMN     "code" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");
