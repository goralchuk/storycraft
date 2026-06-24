ALTER TABLE "Book" ADD COLUMN "styleTemplateId" TEXT;
ALTER TABLE "Book" ADD CONSTRAINT "Book_styleTemplateId_fkey" FOREIGN KEY ("styleTemplateId") REFERENCES "StyleTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
