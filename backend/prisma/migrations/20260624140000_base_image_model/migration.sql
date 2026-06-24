-- The edit model (qwen-image-edit-plus) requires an input image and can't do
-- text-only generation, so it can't be the base default. Revert to a text-to-image
-- base; the hybrid edit/base selection arrives in 9.7.
ALTER TABLE "AppSettings" ALTER COLUMN "imageModel" SET DEFAULT 'qwen-image-2.0';

UPDATE "AppSettings"
SET "imageModel" = 'qwen-image-2.0'
WHERE "imageModel" = 'qwen-image-edit-plus-2025-12-15';
