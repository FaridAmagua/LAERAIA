import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/admin'
import { badRequest, notFound, tooManyRequests, unauthorized } from '@/lib/http'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rateLimit'
import { slugify } from '@/lib/slug'
import { adminUpdatePromptSchema, voteParamsSchema } from '@/lib/validators'
import { removeUploadedImage } from '@/lib/uploads'

async function buildUniqueSlug(baseTitle: string): Promise<string> {
  const base = slugify(baseTitle) || `prompt-${Date.now()}`
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

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
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

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return badRequest('Invalid JSON body')
  }

  const parsed = adminUpdatePromptSchema.safeParse(body)
  if (!parsed.success) {
    return badRequest('Validation failed', parsed.error.flatten())
  }

  const id = parsedParams.data.id
  const existing = await prisma.prompt.findUnique({
    where: { id },
    select: {
      id: true,
      locale: true,
      status: true,
      type: true,
      category: true,
      collection: true,
      style: true,
      mood: true,
      duration: true,
      tags: true,
      tool: true,
      youtubeUrl: true,
      resultUrl: true,
      previewImageUrl: true,
      previewImageMasterUrl: true,
      previewImageCardUrl: true,
      previewImageDetailUrl: true,
      previewFocusX: true,
      previewFocusY: true,
      previewScale: true,
      source: true,
    },
  })

  if (!existing || (existing.status !== 'pending' && existing.status !== 'approved')) {
    return notFound('Editable prompt not found')
  }

  const payload = parsed.data

  const updated = await prisma.$transaction(async (tx) => {
    const main = await tx.prompt.update({
      where: { id },
      data: {
        locale: payload.locale,
        type: payload.type,
        title: payload.title,
        description: payload.description || null,
        promptText: payload.promptText,
        category: payload.category,
        collection: payload.collection,
        style: payload.style,
        mood: payload.mood,
        duration: payload.duration,
        tags: payload.tags,
        tool: payload.tool,
        previewFocusX: payload.previewFocusX,
        previewFocusY: payload.previewFocusY,
        previewScale: payload.previewScale,
        youtubeUrl: payload.youtubeUrl || null,
        resultUrl: payload.resultUrl || null,
      },
      include: { _count: { select: { votes: true } } },
    })

    if (payload.translation && payload.translation.locale !== payload.locale) {
      const targetLocale = payload.translation.locale
      const translationWhere = {
        id: { not: main.id },
        locale: targetLocale,
        type: main.type,
        source: main.source,
        OR: [
          payload.resultUrl ? { resultUrl: payload.resultUrl } : undefined,
          payload.youtubeUrl ? { youtubeUrl: payload.youtubeUrl } : undefined,
          existing.previewImageMasterUrl ? { previewImageMasterUrl: existing.previewImageMasterUrl } : undefined,
          existing.previewImageUrl ? { previewImageUrl: existing.previewImageUrl } : undefined,
        ].filter(Boolean),
      }

      const candidate = translationWhere.OR.length
        ? await tx.prompt.findFirst({
            where: translationWhere,
            select: { id: true },
            orderBy: { updatedAt: 'desc' },
          })
        : null

      if (candidate) {
        await tx.prompt.update({
          where: { id: candidate.id },
          data: {
            locale: targetLocale,
            title: payload.translation.title,
            description: payload.translation.description || null,
            promptText: payload.translation.promptText,
            category: payload.category,
            collection: payload.collection,
            style: payload.style,
            mood: payload.mood,
            duration: payload.duration,
            tags: payload.tags,
            tool: payload.tool,
            youtubeUrl: payload.youtubeUrl || null,
            resultUrl: payload.resultUrl || null,
            previewFocusX: payload.previewFocusX,
            previewFocusY: payload.previewFocusY,
            previewScale: payload.previewScale,
          },
        })
      } else {
        const slug = await buildUniqueSlug(payload.translation.title)
        await tx.prompt.create({
          data: {
            slug,
            locale: targetLocale,
            type: payload.type,
            title: payload.translation.title,
            description: payload.translation.description || null,
            promptText: payload.translation.promptText,
            category: payload.category,
            collection: payload.collection,
            style: payload.style,
            mood: payload.mood,
            duration: payload.duration,
            tags: payload.tags,
            tool: payload.tool,
            previewImageUrl: existing.previewImageUrl,
            previewImageMasterUrl: existing.previewImageMasterUrl,
            previewImageCardUrl: existing.previewImageCardUrl,
            previewImageDetailUrl: existing.previewImageDetailUrl,
            previewFocusX: payload.previewFocusX,
            previewFocusY: payload.previewFocusY,
            previewScale: payload.previewScale,
            youtubeUrl: payload.youtubeUrl || null,
            resultUrl: payload.resultUrl || null,
            source: existing.source,
            status: existing.status,
          },
        })
      }
    }

    return main
  })

  return NextResponse.json({
    id: updated.id,
    title: updated.title,
    description: updated.description,
    promptText: updated.promptText,
    locale: updated.locale,
    type: updated.type,
    category: updated.category,
    collection: updated.collection,
    style: updated.style,
    mood: updated.mood,
    duration: updated.duration,
    tool: updated.tool,
    tags: updated.tags,
    youtubeUrl: updated.youtubeUrl,
    resultUrl: updated.resultUrl,
    previewFocusX: updated.previewFocusX,
    previewFocusY: updated.previewFocusY,
    previewScale: updated.previewScale,
  })
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
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

  const id = parsedParams.data.id
  const prompt = await prisma.prompt.findUnique({
    where: { id },
    select: {
      id: true,
      previewImageUrl: true,
      previewImageMasterUrl: true,
      previewImageCardUrl: true,
      previewImageDetailUrl: true,
    },
  })

  if (!prompt) {
    return notFound('Prompt not found')
  }

  await prisma.prompt.delete({ where: { id } })

  const imageUrls = [prompt.previewImageUrl, prompt.previewImageMasterUrl, prompt.previewImageCardUrl, prompt.previewImageDetailUrl]
    .filter(Boolean)
    .filter((url, index, arr) => arr.indexOf(url) === index)

  await Promise.all(imageUrls.map((url) => removeUploadedImage(url)))

  return NextResponse.json({ ok: true, id })
}


