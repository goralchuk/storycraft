-- AlterTable
ALTER TABLE "AppSettings" ALTER COLUMN "imageModel" SET DEFAULT 'qwen-image-edit-plus-2025-12-15';

-- Move the live singleton to the new edit model, but only if it is still on the
-- previous default (don't stomp a deliberate admin override like wan2.7-image-pro).
UPDATE "AppSettings"
SET "imageModel" = 'qwen-image-edit-plus-2025-12-15'
WHERE "imageModel" = 'qwen-image-2.0';
