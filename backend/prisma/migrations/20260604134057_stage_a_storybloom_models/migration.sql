-- CreateEnum
CREATE TYPE "TemplateCategory" AS ENUM ('FANTASY', 'ADVENTURE', 'NATURE', 'SCIENCE', 'FRIENDSHIP', 'ANIMALS');

-- CreateEnum
CREATE TYPE "WritingStyle" AS ENUM ('WATERCOLOR', 'ADVENTURE', 'FUNNY', 'GENTLE');

-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "fear" TEXT,
ADD COLUMN     "pageCount" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "photoUrl" TEXT,
ADD COLUMN     "promptText" TEXT,
ADD COLUMN     "slots" JSONB,
ADD COLUMN     "title" TEXT,
ADD COLUMN     "topicId" TEXT,
ADD COLUMN     "writingStyle" "WritingStyle";

-- AlterTable
ALTER TABLE "Child" ADD COLUMN     "photoUrl" TEXT;

-- AlterTable
ALTER TABLE "Illustration" ADD COLUMN     "featuresChild" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Template" ADD COLUMN     "ageRange" TEXT,
ADD COLUMN     "availablePages" INTEGER[],
ADD COLUMN     "badge" TEXT,
ADD COLUMN     "category" "TemplateCategory",
ADD COLUMN     "coverColor" TEXT,
ADD COLUMN     "defaultTone" TEXT,
ADD COLUMN     "icon" TEXT,
ADD COLUMN     "tags" JSONB;

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "prompts" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "textProvider" TEXT NOT NULL DEFAULT 'stub',
    "textModel" TEXT NOT NULL DEFAULT 'gpt-4o-mini',
    "imageProvider" TEXT NOT NULL DEFAULT 'stub',
    "imageModel" TEXT NOT NULL DEFAULT 'dall-e-3',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
