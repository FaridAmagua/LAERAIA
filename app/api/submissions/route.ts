import { randomUUID } from 'node:crypto'
import sharp from 'sharp'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rateLimit'
import { badRequest, tooManyRequests } from '@/lib/http'
import { submissionFieldsSchema } from '@/lib/validators'
import { movePendingToApproved, randomWebpFileName, uploadVariantBuffer } from '@/lib/uploads'
import { slugify } from '@/lib/slug'

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_FILE_SIZE = 10 * 1024 * 1024
const MIN_WIDTH = 300
const AUTO_APPROVE_SUBMISSIONS = process.env.AUTO_APPROVE_SUBMISSIONS === 'true'

type UiLocale = 'es' | 'en'

function normalizeLocale(value: FormDataEntryValue | null | undefined): UiLocale {
  return String(value ?? '').trim() === 'en' ? 'en' : 'es'
}

function t(locale: UiLocale, es: string, en: string): string {
  return locale === 'en' ? en : es
}

async function buildUniqueSlug(baseTitle: string): Promise<string> {
  const base = slugify(baseTitle) || `prompt-${randomUUID().slice(0, 8)}`
  let attempt = 0

  while (attempt < 12) {
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
  const limit = checkRateLimit(request.headers, 'submitPrompt')
  if (!limit.allowed) {
    return tooManyRequests(limit.retryAfter)
  }

  let formData: FormData

  try {
    formData = await request.formData()
  } catch {
    return badRequest('Invalid multipart/form-data body')
  }

  const uiLocale = normalizeLocale(formData.get('locale'))

  const file = formData.get('image')

  if (!(file instanceof File)) {
    return badRequest(t(uiLocale, 'La imagen es obligatoria (campo: image).', 'Image file is required (field: image).'))
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return badRequest(t(uiLocale, 'Formato invalido. Permitidos: JPG, PNG, WEBP.', 'Invalid image type. Allowed: JPG, PNG, WEBP.'))
  }

  if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
    return badRequest(t(uiLocale, 'El tamano de la imagen debe ser mayor que 0 y menor o igual a 10MB.', 'Image size must be >0 and <= 10MB.'))
  }

  const rawFields = {
    locale: String(formData.get('locale') ?? '').trim(),
    type: String(formData.get('type') ?? '').trim(),
    title: String(formData.get('title') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim(),
    promptText: String(formData.get('promptText') ?? '').trim(),
    category: String(formData.get('category') ?? '').trim(),
    collection: String(formData.get('collection') ?? 'general').trim() || 'general',
    style: String(formData.get('style') ?? '').trim(),
    mood: String(formData.get('mood') ?? '').trim(),
    duration: String(formData.get('duration') ?? '').trim(),
    tool: String(formData.get('tool') ?? '').trim(),
    youtubeUrl: String(formData.get('youtubeUrl') ?? '').trim(),
    resultUrl: String(formData.get('resultUrl') ?? '').trim(),
    previewFocusX: Number(formData.get('previewFocusX') ?? 50),
    previewFocusY: Number(formData.get('previewFocusY') ?? 50),
    previewScale: Number(formData.get('previewScale') ?? 100),
    tags: String(formData.get('tags') ?? '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
  }

  const parsedFields = submissionFieldsSchema.safeParse(rawFields)
  if (!parsedFields.success) {
    return badRequest(t(uiLocale, 'La validacion fallo.', 'Validation failed.'), parsedFields.error.flatten())
  }

  const fileBuffer = Buffer.from(await file.arrayBuffer())
  const image = sharp(fileBuffer).rotate()
  const metadata = await image.metadata()

  if (!metadata.width || metadata.width < MIN_WIDTH) {
    return badRequest(t(uiLocale, 'La imagen es demasiado pequena. El ancho minimo es 300px.', 'Image is too small. Minimum width is 300px.'))
  }

  const [masterOutput, cardOutput, detailOutput] = await Promise.all([
    image.clone().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer(),
    image
      .clone()
      .resize({ width: 800, height: 450, fit: 'cover', position: 'attention', withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer(),
    image
      .clone()
      .resize({ width: 1080, height: 1920, fit: 'cover', position: 'attention', withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer(),
  ])

  const fileName = randomWebpFileName()

  const [pendingMasterUrl, pendingCardUrl, pendingDetailUrl] = await Promise.all([
    uploadVariantBuffer('pending', 'master', fileName, masterOutput),
    uploadVariantBuffer('pending', 'card', fileName, cardOutput),
    uploadVariantBuffer('pending', 'detail', fileName, detailOutput),
  ])

  let previewMasterUrl = pendingMasterUrl
  let previewCardUrl = pendingCardUrl
  let previewDetailUrl = pendingDetailUrl
  let status: 'pending' | 'approved' = 'pending'

  if (AUTO_APPROVE_SUBMISSIONS) {
    const [approvedMasterUrl, approvedCardUrl, approvedDetailUrl] = await Promise.all([
      movePendingToApproved(pendingMasterUrl),
      movePendingToApproved(pendingCardUrl),
      movePendingToApproved(pendingDetailUrl),
    ])

    previewMasterUrl = approvedMasterUrl
    previewCardUrl = approvedCardUrl
    previewDetailUrl = approvedDetailUrl
    status = 'approved'
  }

  const slug = await buildUniqueSlug(parsedFields.data.title)

  await prisma.prompt.create({
    data: {
      slug,
      locale: parsedFields.data.locale,
      type: parsedFields.data.type,
      title: parsedFields.data.title,
      description: parsedFields.data.description || null,
      promptText: parsedFields.data.promptText,
      category: parsedFields.data.category,
      collection: parsedFields.data.collection,
      style: parsedFields.data.style,
      mood: parsedFields.data.mood,
      duration: parsedFields.data.duration,
      tags: parsedFields.data.tags,
      tool: parsedFields.data.tool,
      previewImageUrl: previewCardUrl,
      previewImageMasterUrl: previewMasterUrl,
      previewImageCardUrl: previewCardUrl,
      previewImageDetailUrl: previewDetailUrl,
      previewFocusX: parsedFields.data.previewFocusX,
      previewFocusY: parsedFields.data.previewFocusY,
      previewScale: parsedFields.data.previewScale,
      youtubeUrl: parsedFields.data.youtubeUrl || null,
      resultUrl: parsedFields.data.resultUrl || null,
      source: 'community',
      status,
    },
  })

  return NextResponse.json(
    {
      ok: true,
      status,
      message: AUTO_APPROVE_SUBMISSIONS
        ? t(uiLocale, 'Publicacion enviada y publicada correctamente.', 'Submission published successfully.')
        : t(uiLocale, 'Publicacion enviada. Esta pendiente de moderacion.', 'Submission received and pending moderation.'),
    },
    { status: 201 },
  )
}
