-- CreateTable
CREATE TABLE "_SavedPromoCodes" (
    "A" TEXT NOT NULL,
    "B" BIGINT NOT NULL,

    CONSTRAINT "_SavedPromoCodes_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_SavedPromoCodes_B_index" ON "_SavedPromoCodes"("B");

-- AddForeignKey
ALTER TABLE "_SavedPromoCodes" ADD CONSTRAINT "_SavedPromoCodes_A_fkey" FOREIGN KEY ("A") REFERENCES "PromoCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SavedPromoCodes" ADD CONSTRAINT "_SavedPromoCodes_B_fkey" FOREIGN KEY ("B") REFERENCES "TgUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
