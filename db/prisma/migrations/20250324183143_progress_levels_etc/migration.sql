-- AlterTable
ALTER TABLE "TgUser" ADD COLUMN     "userProgressId" TEXT,
ADD CONSTRAINT "TgUser_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "UserProgress" (
    "id" TEXT NOT NULL,
    "currentLevelId" TEXT NOT NULL,
    "tgUserId" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Level" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "usersCount" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "instantBonusDays" INTEGER NOT NULL,
    "constantBonusDays" INTEGER NOT NULL,
    "constantBonusDiscount" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Level_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProgress_tgUserId_key" ON "UserProgress"("tgUserId");

-- AddForeignKey
ALTER TABLE "TgUser" ADD CONSTRAINT "TgUser_userProgressId_fkey" FOREIGN KEY ("userProgressId") REFERENCES "UserProgress"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProgress" ADD CONSTRAINT "UserProgress_currentLevelId_fkey" FOREIGN KEY ("currentLevelId") REFERENCES "Level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProgress" ADD CONSTRAINT "UserProgress_tgUserId_fkey" FOREIGN KEY ("tgUserId") REFERENCES "TgUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
