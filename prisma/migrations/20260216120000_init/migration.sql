-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."Locale" AS ENUM ('es', 'en');

-- CreateEnum
CREATE TYPE "public"."PromptType" AS ENUM ('video', 'image', 'seo');

-- CreateEnum
CREATE TYPE "public"."PromptSource" AS ENUM ('official', 'community');

-- CreateEnum
CREATE TYPE "public"."PromptStatus" AS ENUM ('approved', 'pending');

-- CreateTable
CREATE TABLE "public"."Prompt" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "locale" "public"."Locale" NOT NULL,
    "type" "public"."PromptType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "promptText" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "style" TEXT NOT NULL,
    "mood" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "settingsJson" JSONB,
    "tags" TEXT[],
    "tool" TEXT,
    "previewImageUrl" TEXT,
    "previewVideoUrl" TEXT,
    "resultUrl" TEXT,
    "source" "public"."PromptSource" NOT NULL DEFAULT 'official',
    "status" "public"."PromptStatus" NOT NULL DEFAULT 'approved',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prompt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Vote" (
    "id" TEXT NOT NULL,
    "promptId" TEXT NOT NULL,
    "voterHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Prompt_slug_key" ON "public"."Prompt"("slug");

-- CreateIndex
CREATE INDEX "Prompt_locale_status_createdAt_idx" ON "public"."Prompt"("locale", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Prompt_locale_type_status_createdAt_idx" ON "public"."Prompt"("locale", "type", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Vote_promptId_idx" ON "public"."Vote"("promptId");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_promptId_voterHash_key" ON "public"."Vote"("promptId", "voterHash");

-- AddForeignKey
ALTER TABLE "public"."Vote" ADD CONSTRAINT "Vote_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "public"."Prompt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

