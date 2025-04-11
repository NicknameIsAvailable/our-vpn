/*
  Warnings:

  - A unique constraint covering the columns `[referrerId]` on the table `PromoCode` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_referrerId_key" ON "PromoCode"("referrerId");
