-- CreateEnum
CREATE TYPE "BookType" AS ENUM ('UNIQUE', 'TEMPLATE');

-- AlterEnum
ALTER TYPE "BookStatus" ADD VALUE 'DRAFT';

-- DropForeignKey
ALTER TABLE "Book" DROP CONSTRAINT "Book_childId_fkey";

-- DropForeignKey
ALTER TABLE "Book" DROP CONSTRAINT "Book_templateId_fkey";

-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "bookType" "BookType" NOT NULL DEFAULT 'UNIQUE',
ALTER COLUMN "childId" DROP NOT NULL,
ALTER COLUMN "templateId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE SET NULL ON UPDATE CASCADE;
