-- Add multi-size preview columns with safe backfill.
ALTER TABLE "Prompt"
  ADD COLUMN IF NOT EXISTS "previewImageMasterUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "previewImageCardUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "previewImageDetailUrl" TEXT;

UPDATE "Prompt"
SET "previewImageUrl" = ''
WHERE "previewImageUrl" IS NULL;

UPDATE "Prompt"
SET "previewImageMasterUrl" = ''
WHERE "previewImageMasterUrl" IS NULL;

UPDATE "Prompt"
SET "previewImageCardUrl" = ''
WHERE "previewImageCardUrl" IS NULL;

UPDATE "Prompt"
SET "previewImageDetailUrl" = ''
WHERE "previewImageDetailUrl" IS NULL;

UPDATE "Prompt"
SET "previewImageCardUrl" = "previewImageUrl"
WHERE "previewImageCardUrl" = '' AND "previewImageUrl" <> '';

UPDATE "Prompt"
SET "previewImageMasterUrl" = "previewImageUrl"
WHERE "previewImageMasterUrl" = '' AND "previewImageUrl" <> '';

UPDATE "Prompt"
SET "previewImageDetailUrl" = COALESCE(NULLIF("previewImageMasterUrl", ''), "previewImageUrl")
WHERE "previewImageDetailUrl" = '' AND ("previewImageMasterUrl" <> '' OR "previewImageUrl" <> '');

UPDATE "Prompt"
SET "previewImageUrl" = "previewImageCardUrl"
WHERE "previewImageCardUrl" <> '' AND "previewImageUrl" <> "previewImageCardUrl";

ALTER TABLE "Prompt"
  ALTER COLUMN "previewImageUrl" SET DEFAULT '',
  ALTER COLUMN "previewImageUrl" SET NOT NULL,
  ALTER COLUMN "previewImageMasterUrl" SET DEFAULT '',
  ALTER COLUMN "previewImageMasterUrl" SET NOT NULL,
  ALTER COLUMN "previewImageCardUrl" SET DEFAULT '',
  ALTER COLUMN "previewImageCardUrl" SET NOT NULL,
  ALTER COLUMN "previewImageDetailUrl" SET DEFAULT '',
  ALTER COLUMN "previewImageDetailUrl" SET NOT NULL;
