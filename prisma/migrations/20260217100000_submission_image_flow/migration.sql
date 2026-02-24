-- Add rejected status value
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'PromptStatus' AND e.enumlabel = 'rejected'
  ) THEN
    ALTER TYPE "public"."PromptStatus" ADD VALUE 'rejected';
  END IF;
END $$;

-- Prompt table updates for submission + moderation image flow
ALTER TABLE "public"."Prompt"
  ADD COLUMN IF NOT EXISTS "youtubeUrl" TEXT;

ALTER TABLE "public"."Prompt"
  ALTER COLUMN "description" DROP NOT NULL;

UPDATE "public"."Prompt"
SET "previewImageUrl" = ''
WHERE "previewImageUrl" IS NULL;

ALTER TABLE "public"."Prompt"
  ALTER COLUMN "previewImageUrl" SET DEFAULT '',
  ALTER COLUMN "previewImageUrl" SET NOT NULL;

ALTER TABLE "public"."Prompt"
  DROP COLUMN IF EXISTS "previewVideoUrl";

ALTER TABLE "public"."Prompt"
  ALTER COLUMN "source" SET DEFAULT 'community',
  ALTER COLUMN "status" SET DEFAULT 'pending';

UPDATE "public"."Prompt"
SET "tags" = '{}'
WHERE "tags" IS NULL;

ALTER TABLE "public"."Prompt"
  ALTER COLUMN "tags" SET DEFAULT '{}',
  ALTER COLUMN "tags" SET NOT NULL;
