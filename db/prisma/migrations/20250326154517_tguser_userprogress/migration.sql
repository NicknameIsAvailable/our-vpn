/*
  Warnings:

  - You are about to drop the column `userProgressId` on the `TgUser` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_progress_id]` on the table `TgUser` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "TgUser" DROP CONSTRAINT "TgUser_userProgressId_fkey";

-- AlterTable
ALTER TABLE "TgUser" DROP COLUMN "userProgressId",
ADD COLUMN     "user_progress_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "TgUser_user_progress_id_key" ON "TgUser"("user_progress_id");

-- AddForeignKey
ALTER TABLE "TgUser" ADD CONSTRAINT "TgUser_user_progress_id_fkey" FOREIGN KEY ("user_progress_id") REFERENCES "UserProgress"("id") ON DELETE SET NULL ON UPDATE CASCADE;
