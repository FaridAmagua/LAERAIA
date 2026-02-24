ALTER TABLE "Prompt"
  ADD COLUMN IF NOT EXISTS "previewFocusX" INTEGER,
  ADD COLUMN IF NOT EXISTS "previewScale" INTEGER;

UPDATE "Prompt"
SET "previewFocusX" = 50
WHERE "previewFocusX" IS NULL;

UPDATE "Prompt"
SET "previewScale" = 100
WHERE "previewScale" IS NULL;

ALTER TABLE "Prompt"
  ALTER COLUMN "previewFocusX" SET DEFAULT 50,
  ALTER COLUMN "previewFocusX" SET NOT NULL,
  ALTER COLUMN "previewScale" SET DEFAULT 100,
  ALTER COLUMN "previewScale" SET NOT NULL;
