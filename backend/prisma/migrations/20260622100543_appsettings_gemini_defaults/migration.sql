-- AlterTable
ALTER TABLE "AppSettings" ALTER COLUMN "textProvider" SET DEFAULT 'gemini',
ALTER COLUMN "textModel" SET DEFAULT 'gemini-2.5-flash',
ALTER COLUMN "imageProvider" SET DEFAULT 'gemini',
ALTER COLUMN "imageModel" SET DEFAULT 'gemini-2.5-flash-image';

-- Flip the live singleton off the seeded placeholders (leave any deliberate admin override untouched).
UPDATE "AppSettings"
SET "textProvider" = 'gemini',
    "textModel" = 'gemini-2.5-flash',
    "imageProvider" = 'gemini',
    "imageModel" = 'gemini-2.5-flash-image'
WHERE "textProvider" = 'stub'
  AND "textModel" = 'gpt-4o-mini'
  AND "imageProvider" = 'stub'
  AND "imageModel" = 'dall-e-3';
