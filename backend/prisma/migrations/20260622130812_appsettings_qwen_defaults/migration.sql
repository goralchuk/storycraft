-- AlterTable
ALTER TABLE "AppSettings" ALTER COLUMN "textProvider" SET DEFAULT 'qwen',
ALTER COLUMN "textModel" SET DEFAULT 'qwen3.7-plus',
ALTER COLUMN "imageProvider" SET DEFAULT 'qwen',
ALTER COLUMN "imageModel" SET DEFAULT 'qwen-image-2.0';

-- Move the live singleton to Qwen (leave any deliberate non-default admin override untouched).
UPDATE "AppSettings"
SET "textProvider" = 'qwen',
    "textModel" = 'qwen3.7-plus',
    "imageProvider" = 'qwen',
    "imageModel" = 'qwen-image-2.0'
WHERE "textProvider" IN ('stub', 'gemini')
  AND "imageProvider" IN ('stub', 'gemini');
