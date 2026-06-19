-- CreateEnum
CREATE TYPE "BookStage" AS ENUM ('HEROES', 'STORY', 'ILLUSTRATIONS', 'ASSEMBLE');

-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "progress" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stage" "BookStage";
