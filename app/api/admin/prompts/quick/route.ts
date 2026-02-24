import { NextRequest, NextResponse } from 'next/server'
import { PromptSource, PromptStatus, PromptType } from '@prisma/client'
import { z } from 'zod'
import { isAdminRequest } from '@/lib/admin'
import { badRequest, tooManyRequests, unauthorized } from '@/lib/http'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rateLimit'
import { slugify } from '@/lib/slug'
import { PROMPT_CATEGORY_OPTIONS, PROMPT_MOOD_OPTIONS, PROMPT_STYLE_OPTIONS, PROMPT_TOOL_OPTIONS } from '@/lib/promptOptions'

const quickCreateSchema = z.object({
  title: z.string().trim().min(4).max(120),
  promptText: z.string().trim().min(10).max(5000),
  locale: z.enum(['es', 'en']).default('es'),
  type: z.enum(['video', 'image', 'seo']).default('image'),
})

async function buildUniqueSlug(baseTitle: string): Promise<string> {
  const base = slugify(baseTitle) || 'prompt'
  let attempt = 0

  while (attempt < 20) {
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

export async function POST(request: NextRequest) {
  const limit = checkRateLimit(request.headers, 'moderation')
  if (!limit.allowed) {
    return tooManyRequests(limit.retryAfter)
  }

  if (!isAdminRequest(request)) {
    return unauthorized()
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return badRequest('Invalid JSON body')
  }

  const parsed = quickCreateSchema.safeParse(body)
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
      description: null,
      promptText: payload.promptText,
      category: PROMPT_CATEGORY_OPTIONS[0],
      collection: 'general',
      style: PROMPT_STYLE_OPTIONS[0],
      mood: PROMPT_MOOD_OPTIONS[0],
      duration: 'N/A',
      tags: [],
      tool: PROMPT_TOOL_OPTIONS[0],
      previewImageUrl: '',
      previewImageMasterUrl: '',
      previewImageCardUrl: '',
      previewImageDetailUrl: '',
      previewFocusX: 50,
      previewFocusY: 50,
      previewScale: 100,
      youtubeUrl: null,
      resultUrl: null,
      source: PromptSource.official,
      status: PromptStatus.approved,
    },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
    },
  })

  return NextResponse.json({ ok: true, ...prompt }, { status: 201 })
}

