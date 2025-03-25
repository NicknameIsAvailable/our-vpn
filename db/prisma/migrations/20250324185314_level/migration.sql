/*
  Warnings:

  - Changed the type of `usersCount` on the `Level` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Level" DROP COLUMN "usersCount",
ADD COLUMN     "usersCount" INTEGER NOT NULL;
