import sharp from 'sharp'
import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/admin'
import { badRequest, notFound, tooManyRequests, unauthorized } from '@/lib/http'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rateLimit'
import { voteParamsSchema } from '@/lib/validators'
import {
  uploadVariantBuffer,
  randomWebpFileName,
  removeUploadedImage,
} from '@/lib/uploads'

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_FILE_SIZE = 10 * 1024 * 1024
const MIN_WIDTH = 300

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const limit = checkRateLimit(request.headers, 'upload')
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

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return badRequest('Invalid multipart/form-data body')
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return badRequest('Image file is required (field: file)')
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return badRequest('Invalid image type. Allowed: JPG, PNG, WEBP')
  }

  if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
    return badRequest('Image size must be >0 and <= 10MB')
  }

  const prompt = await prisma.prompt.findUnique({
    where: { id: parsedParams.data.id },
    select: {
      id: true,
      status: true,
      previewImageUrl: true,
      previewImageMasterUrl: true,
      previewImageCardUrl: true,
      previewImageDetailUrl: true,
    },
  })

  if (!prompt || (prompt.status !== 'pending' && prompt.status !== 'approved')) {
    return notFound('Editable prompt not found')
  }

  const fileBuffer = Buffer.from(await file.arrayBuffer())
  const image = sharp(fileBuffer).rotate()
  const metadata = await image.metadata()

  if (!metadata.width || metadata.width < MIN_WIDTH) {
    return badRequest('Image is too small. Minimum width is 300px')
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
  const isApproved = prompt.status === 'approved'
  const stage = isApproved ? 'approved' : 'pending'

  const [masterUrl, cardUrl, detailUrl] = await Promise.all([
    uploadVariantBuffer(stage, 'master', fileName, masterOutput),
    uploadVariantBuffer(stage, 'card', fileName, cardOutput),
    uploadVariantBuffer(stage, 'detail', fileName, detailOutput),
  ])

  await prisma.prompt.update({
    where: { id: prompt.id },
    data: {
      previewImageUrl: cardUrl,
      previewImageMasterUrl: masterUrl,
      previewImageCardUrl: cardUrl,
      previewImageDetailUrl: detailUrl,
    },
  })

  const oldUrls = [prompt.previewImageUrl, prompt.previewImageMasterUrl, prompt.previewImageCardUrl, prompt.previewImageDetailUrl]
    .filter(Boolean)
    .filter((url, index, arr) => arr.indexOf(url) === index)

  await Promise.all(oldUrls.map((url) => removeUploadedImage(url)))

  return NextResponse.json({
    ok: true,
    message: 'Preview image updated.',
    previewImageUrl: cardUrl,
    previewImageMasterUrl: masterUrl,
    previewImageCardUrl: cardUrl,
    previewImageDetailUrl: detailUrl,
  })
}

