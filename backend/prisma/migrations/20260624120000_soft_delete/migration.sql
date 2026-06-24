-- Soft-delete: a non-null deletedAt means the row is logically deleted (kept, not destroyed).
ALTER TABLE "Child" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Hero" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Book" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "BookPage" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Illustration" ADD COLUMN "deletedAt" TIMESTAMP(3);
