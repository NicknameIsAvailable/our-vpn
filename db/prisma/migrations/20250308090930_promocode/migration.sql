-- CreateTable
CREATE TABLE "PromoCode" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "discountPercent" INTEGER NOT NULL,

    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);
