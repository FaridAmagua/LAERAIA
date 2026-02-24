ALTER TABLE "Prompt"
  ADD COLUMN IF NOT EXISTS "collection" TEXT;

UPDATE "Prompt"
SET "collection" = 'general'
WHERE "collection" IS NULL OR TRIM("collection") = '';

ALTER TABLE "Prompt"
  ALTER COLUMN "collection" SET DEFAULT 'general',
  ALTER COLUMN "collection" SET NOT NULL;
