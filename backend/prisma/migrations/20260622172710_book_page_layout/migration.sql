-- CreateEnum
CREATE TYPE "PageLayout" AS ENUM ('IMAGE_ONLY', 'IMAGE_TEXT', 'TEXT_ONLY');

-- AlterTable
ALTER TABLE "BookPage" ADD COLUMN     "layout" "PageLayout" NOT NULL DEFAULT 'IMAGE_TEXT';
