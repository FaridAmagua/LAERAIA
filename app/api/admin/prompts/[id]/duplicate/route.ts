import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/admin'
import { badRequest, notFound, tooManyRequests, unauthorized } from '@/lib/http'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rateLimit'
import { slugify } from '@/lib/slug'
import { voteParamsSchema } from '@/lib/validators'

async function buildUniqueSlug(baseTitle: string): Promise<string> {
  const base = slugify(baseTitle) || `prompt-copy-${Date.now()}`
  let attempt = 0

  while (attempt < 20) {
    const suffix = attempt === 0 ? '' : `-${attempt + 1}`
    const candidate = `${base}${suffix}`
    const exists = await prisma.prompt.findUnique({
      where: { slug: candidate },
      select: { id: true },
    })

    if (!exists) {
      return candidate
    }

    attempt += 1
  }

  return `${base}-${Date.now()}`
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const limit = checkRateLimit(request.headers, 'moderation')
  if (!limit.allowed) {
    return tooManyRequests(limit.retryAfter)
  }

  if (!isAdminRequest(request)) {
    return unauthorized()
  }

  const parsedParams = voteParamsSchema.safeParse(await context.params)
  if (!parsedParams.success) {
    return badRequest('Invalid prompt id', parsedParams.error.flatten())
  }

  const source = await prisma.prompt.findUnique({
    where: { id: parsedParams.data.id },
  })

  if (!source) {
    return notFound('Prompt not found')
  }

  if (source.status !== 'approved') {
    return badRequest('Only approved prompts can be duplicated')
  }

  const baseTitle = `${source.title} copy`
  const slug = await buildUniqueSlug(baseTitle)
  const title = source.locale === 'es' ? `${source.title} (copia)` : `${source.title} (copy)`

  const duplicated = await prisma.prompt.create({
    data: {
      slug,
      locale: source.locale,
      type: source.type,
      title,
      description: source.description,
      promptText: source.promptText,
      category: source.category,
      collection: source.collection,
      style: source.style,
      mood: source.mood,
      duration: source.duration,
      settingsJson: source.settingsJson,
      tags: source.tags,
      tool: source.tool,
      previewImageUrl: source.previewImageUrl,
      previewImageMasterUrl: source.previewImageMasterUrl,
      previewImageCardUrl: source.previewImageCardUrl,
      previewImageDetailUrl: source.previewImageDetailUrl,
      previewFocusX: source.previewFocusX,
      previewFocusY: source.previewFocusY,
      previewScale: source.previewScale,
      youtubeUrl: source.youtubeUrl,
      resultUrl: source.resultUrl,
      source: source.source,
      status: source.status,
    },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
    },
  })

  return NextResponse.json({
    ok: true,
    ...duplicated,
  })
}


