import { createHash, randomUUID } from 'node:crypto'
import { copyFile, mkdir, rename, rm, stat } from 'node:fs/promises'
import path from 'node:path'
import { v2 as cloudinary } from 'cloudinary'

const UPLOAD_ROOT = process.env.UPLOAD_ROOT || path.join(process.cwd(), 'uploads')
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET
const CLOUDINARY_BASE_FOLDER = (process.env.CLOUDINARY_BASE_FOLDER || 'promptify').replace(/^\/+|\/+$/g, '')

export const CLOUDINARY_ENABLED = Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET)

if (CLOUDINARY_ENABLED) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  })
}

export const PENDING_DIR = path.join(UPLOAD_ROOT, 'pending')
export const APPROVED_DIR = path.join(UPLOAD_ROOT, 'approved')
export const IMAGE_VARIANTS = ['master', 'card', 'detail'] as const
export type ImageVariant = (typeof IMAGE_VARIANTS)[number]

function safeFileName(fileName: string): string {
  return path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '')
}

function safeVariant(variant: string): ImageVariant | null {
  if ((IMAGE_VARIANTS as readonly string[]).includes(variant)) {
    return variant as ImageVariant
  }
  return null
}

function parseUploadUrl(url: string, root: '/uploads/pending/' | '/uploads/approved/'): { variant?: ImageVariant; fileName: string } | null {
  if (!url.startsWith(root)) {
    return null
  }

  const relative = url.slice(root.length)
  if (!relative || relative.includes('..')) {
    return null
  }

  const parts = relative.split('/').filter(Boolean)
  if (parts.length === 1) {
    return { fileName: safeFileName(parts[0]) }
  }

  if (parts.length === 2) {
    const variant = safeVariant(parts[0])
    if (!variant) {
      return null
    }

    return { variant, fileName: safeFileName(parts[1]) }
  }

  return null
}

function fileStem(fileName: string): string {
  return safeFileName(fileName).replace(/\.webp$/i, '')
}

function cloudinaryPublicId(stage: 'pending' | 'approved', variant: ImageVariant, fileName: string): string {
  return `${CLOUDINARY_BASE_FOLDER}/${stage}/${variant}/${fileStem(fileName)}`
}

function extractCloudinaryPublicId(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (!parsed.hostname.includes('res.cloudinary.com')) {
      return null
    }

    const marker = '/upload/'
    const idx = parsed.pathname.indexOf(marker)
    if (idx < 0) {
      return null
    }

    let rest = parsed.pathname.slice(idx + marker.length)
    rest = rest.replace(/^v\d+\//, '')
    rest = rest.replace(/^https?:\/\//, '')
    rest = rest.replace(/\.[a-zA-Z0-9]+$/, '')
    rest = rest.replace(/^\/+/, '')
    return rest || null
  } catch {
    return null
  }
}

function cloudinaryIsPending(url: string): boolean {
  const id = extractCloudinaryPublicId(url)
  return Boolean(id?.includes(`${CLOUDINARY_BASE_FOLDER}/pending/`))
}

function cloudinaryIsApproved(url: string): boolean {
  const id = extractCloudinaryPublicId(url)
  return Boolean(id?.includes(`${CLOUDINARY_BASE_FOLDER}/approved/`))
}

export function isPendingUploadUrl(url: string): boolean {
  return url.startsWith('/uploads/pending/') || cloudinaryIsPending(url)
}

export function isApprovedUploadUrl(url: string): boolean {
  return url.startsWith('/uploads/approved/') || cloudinaryIsApproved(url)
}

export function getPendingUrl(fileName: string): string {
  return `/uploads/pending/${safeFileName(fileName)}`
}

export function getApprovedUrl(fileName: string): string {
  return `/uploads/approved/${safeFileName(fileName)}`
}

export function getPendingVariantUrl(variant: ImageVariant, fileName: string): string {
  return `/uploads/pending/${variant}/${safeFileName(fileName)}`
}

export function getApprovedVariantUrl(variant: ImageVariant, fileName: string): string {
  return `/uploads/approved/${variant}/${safeFileName(fileName)}`
}

export function pendingPathFromUrl(url: string): string {
  const parsed = parseUploadUrl(url, '/uploads/pending/')
  if (!parsed) {
    throw new Error('Invalid pending upload URL')
  }

  return parsed.variant ? path.join(PENDING_DIR, parsed.variant, parsed.fileName) : path.join(PENDING_DIR, parsed.fileName)
}

export function approvedPathFromUrl(url: string): string {
  const parsed = parseUploadUrl(url, '/uploads/approved/')
  if (!parsed) {
    throw new Error('Invalid approved upload URL')
  }

  return parsed.variant ? path.join(APPROVED_DIR, parsed.variant, parsed.fileName) : path.join(APPROVED_DIR, parsed.fileName)
}

export function randomWebpFileName(): string {
  const hash = createHash('sha256').update(`${randomUUID()}-${Date.now()}`).digest('hex').slice(0, 24)
  return `${hash}.webp`
}

export async function ensureUploadDirs(): Promise<void> {
  if (CLOUDINARY_ENABLED) {
    return
  }

  await mkdir(PENDING_DIR, { recursive: true })
  await mkdir(APPROVED_DIR, { recursive: true })
  await Promise.all(IMAGE_VARIANTS.map((variant) => mkdir(path.join(PENDING_DIR, variant), { recursive: true })))
  await Promise.all(IMAGE_VARIANTS.map((variant) => mkdir(path.join(APPROVED_DIR, variant), { recursive: true })))
}

export async function uploadVariantBuffer(stage: 'pending' | 'approved', variant: ImageVariant, fileName: string, buffer: Buffer): Promise<string> {
  await ensureUploadDirs()

  if (CLOUDINARY_ENABLED) {
    const publicId = cloudinaryPublicId(stage, variant, fileName)

    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: undefined,
          public_id: publicId,
          resource_type: 'image',
          format: 'webp',
          overwrite: true,
        },
        (error, uploaded) => {
          if (error || !uploaded?.secure_url) {
            reject(error || new Error('Cloudinary upload failed'))
            return
          }
          resolve({ secure_url: uploaded.secure_url })
        },
      )

      stream.end(buffer)
    })

    return result.secure_url
  }

  const localUrl = stage === 'pending' ? getPendingVariantUrl(variant, fileName) : getApprovedVariantUrl(variant, fileName)
  const localPath = stage === 'pending' ? pendingPathFromUrl(localUrl) : approvedPathFromUrl(localUrl)
  await mkdir(path.dirname(localPath), { recursive: true })
  await (await import('node:fs/promises')).writeFile(localPath, buffer)
  return localUrl
}

export async function movePendingToApproved(pendingUrl: string): Promise<string> {
  await ensureUploadDirs()

  if (CLOUDINARY_ENABLED && pendingUrl.startsWith('http')) {
    const fromId = extractCloudinaryPublicId(pendingUrl)
    if (!fromId) {
      throw new Error('Invalid cloudinary pending URL')
    }

    const toId = fromId.replace('/pending/', '/approved/')
    const renamed = await cloudinary.uploader.rename(fromId, toId, { overwrite: true, invalidate: true })
    return renamed.secure_url
  }

  const pendingPath = pendingPathFromUrl(pendingUrl)
  const parsed = parseUploadUrl(pendingUrl, '/uploads/pending/')
  if (!parsed) {
    throw new Error('Invalid pending upload URL')
  }

  const approvedPath = parsed.variant ? path.join(APPROVED_DIR, parsed.variant, parsed.fileName) : path.join(APPROVED_DIR, parsed.fileName)
  const approvedUrl = parsed.variant ? getApprovedVariantUrl(parsed.variant, parsed.fileName) : getApprovedUrl(parsed.fileName)

  try {
    await rename(pendingPath, approvedPath)
  } catch {
    await copyFile(pendingPath, approvedPath)
    await rm(pendingPath, { force: true })
  }

  return approvedUrl
}

export async function removePendingImage(pendingUrl: string): Promise<void> {
  await removeUploadedImage(pendingUrl)
}

export async function removeUploadedImage(url: string): Promise<void> {
  try {
    if (CLOUDINARY_ENABLED && url.startsWith('http')) {
      const publicId = extractCloudinaryPublicId(url)
      if (publicId) {
        await cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true })
      }
      return
    }

    if (url.startsWith('/uploads/pending/')) {
      await rm(pendingPathFromUrl(url), { force: true })
      return
    }

    if (url.startsWith('/uploads/approved/')) {
      await rm(approvedPathFromUrl(url), { force: true })
    }
  } catch {
    // no-op: stale paths should not break moderation flows
  }
}

export async function pendingImageExists(pendingUrl: string): Promise<boolean> {
  if (CLOUDINARY_ENABLED && pendingUrl.startsWith('http')) {
    const publicId = extractCloudinaryPublicId(pendingUrl)
    if (!publicId) {
      return false
    }

    try {
      await cloudinary.api.resource(publicId, { resource_type: 'image' })
      return true
    } catch {
      return false
    }
  }

  try {
    await stat(pendingPathFromUrl(pendingUrl))
    return true
  } catch {
    return false
  }
}
