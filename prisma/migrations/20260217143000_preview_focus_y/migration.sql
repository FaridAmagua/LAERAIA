ALTER TABLE "Prompt"
  ADD COLUMN IF NOT EXISTS "previewFocusY" INTEGER;

UPDATE "Prompt"
SET "previewFocusY" = 50
WHERE "previewFocusY" IS NULL;

ALTER TABLE "Prompt"
  ALTER COLUMN "previewFocusY" SET DEFAULT 50,
  ALTER COLUMN "previewFocusY" SET NOT NULL;
