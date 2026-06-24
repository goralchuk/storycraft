-- CreateEnum
CREATE TYPE "GenerationStatus" AS ENUM ('PENDING', 'PROCESSING', 'DONE', 'FAILED');

-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "templateHistoryId" TEXT;

-- AlterTable
ALTER TABLE "Hero" ADD COLUMN     "imageCaption" TEXT,
ADD COLUMN     "personality" TEXT;

-- AlterTable
ALTER TABLE "Template" ADD COLUMN     "isCustomBase" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "StyleTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "previewUrl" TEXT,
    "prompt" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "StyleTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageLayoutTemplate" (
    "id" TEXT NOT NULL,
    "pageCount" INTEGER NOT NULL,
    "layout" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PageLayoutTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookGeneration" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "status" "GenerationStatus" NOT NULL DEFAULT 'PENDING',
    "currentStep" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookGeneration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookGenerationLog" (
    "id" TEXT NOT NULL,
    "generationId" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'info',
    "message" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookGenerationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookTemplateHistory" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slots" JSONB NOT NULL,
    "pages" JSONB NOT NULL,
    "storyPrompt" TEXT NOT NULL,
    "styleTemplateId" TEXT,
    "themeTemplateId" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "BookTemplateHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PageLayoutTemplate_pageCount_key" ON "PageLayoutTemplate"("pageCount");

-- CreateIndex
CREATE INDEX "BookGeneration_bookId_idx" ON "BookGeneration"("bookId");

-- CreateIndex
CREATE INDEX "BookGenerationLog_generationId_idx" ON "BookGenerationLog"("generationId");

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_templateHistoryId_fkey" FOREIGN KEY ("templateHistoryId") REFERENCES "BookTemplateHistory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookGeneration" ADD CONSTRAINT "BookGeneration_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookGenerationLog" ADD CONSTRAINT "BookGenerationLog_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "BookGeneration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookTemplateHistory" ADD CONSTRAINT "BookTemplateHistory_themeTemplateId_fkey" FOREIGN KEY ("themeTemplateId") REFERENCES "Template"("id") ON DELETE SET NULL ON UPDATE CASCADE;
