import { PromptSource, PromptStatus, PromptType } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { listPrompts } from '@/lib/promptData'
import { prisma } from '@/lib/prisma'
import { createPromptSchema, listPromptsQuerySchema } from '@/lib/validators'
import { badRequest, tooManyRequests } from '@/lib/http'
import { checkRateLimit } from '@/lib/rateLimit'
import { slugify } from '@/lib/slug'

async function buildUniqueSlug(baseTitle: string): Promise<string> {
  const base = slugify(baseTitle) || 'prompt'
  let attempt = 0

  while (attempt < 10) {
    const suffix = attempt === 0 ? '' : `-${attempt + 1}`
    const candidate = `${base}${suffix}`
    const exists = await prisma.prompt.findUnique({ where: { slug: candidate }, select: { id: true } })
    if (!exists) {
      return candidate
    }

    attempt += 1
  }

  return `${base}-${Date.now()}`
}

export async function GET(request: NextRequest) {
  const parsed = listPromptsQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams.entries()))

  if (!parsed.success) {
    return badRequest('Invalid query params', parsed.error.flatten())
  }

  const data = await listPrompts(parsed.data)
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const limit = checkRateLimit(request.headers, 'submitPrompt')
  if (!limit.allowed) {
    return tooManyRequests(limit.retryAfter)
  }

  let raw: unknown

  try {
    raw = await request.json()
  } catch {
    return badRequest('Invalid JSON body')
  }

  const parsed = createPromptSchema.safeParse(raw)
  if (!parsed.success) {
    return badRequest('Validation failed', parsed.error.flatten())
  }

  const payload = parsed.data
  const slug = await buildUniqueSlug(payload.title)

  const prompt = await prisma.prompt.create({
    data: {
      slug,
      locale: payload.locale,
      type: payload.type as PromptType,
      title: payload.title,
      description: payload.description || null,
      promptText: payload.promptText,
      category: payload.category,
      collection: payload.collection,
      style: payload.style,
      mood: payload.mood,
      duration: payload.duration,
      tags: payload.tags,
      tool: payload.tool || null,
      previewImageUrl: payload.previewImageUrl,
      previewImageMasterUrl: payload.previewImageUrl,
      previewImageCardUrl: payload.previewImageUrl,
      previewImageDetailUrl: payload.previewImageUrl,
      previewFocusX: payload.previewFocusX,
      previewFocusY: payload.previewFocusY,
      previewScale: payload.previewScale,
      youtubeUrl: payload.youtubeUrl || null,
      resultUrl: payload.resultUrl || null,
      source: payload.source === 'official' ? PromptSource.official : PromptSource.community,
      status:
        payload.status === 'approved'
          ? PromptStatus.approved
          : payload.status === 'rejected'
            ? PromptStatus.rejected
            : PromptStatus.pending,
    },
    include: { _count: { select: { votes: true } } },
  })

  return NextResponse.json(
    {
      id: prompt.id,
      slug: prompt.slug,
      status: prompt.status,
      message: 'Prompt created.',
    },
    { status: 201 },
  )
}
