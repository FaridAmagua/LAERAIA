import { randomUUID } from 'node:crypto'
import { access, readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import nextEnv from '@next/env'
import { PrismaClient } from '@prisma/client'
import { v2 as cloudinary } from 'cloudinary'

const { loadEnvConfig } = nextEnv
loadEnvConfig(process.cwd())

const args = new Set(process.argv.slice(2))
const APPLY = args.has('--apply')
const INCLUDE_PENDING = args.has('--include-pending')
const DRY_RUN = !APPLY

const prisma = new PrismaClient()

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET
const CLOUDINARY_BASE_FOLDER = (process.env.CLOUDINARY_BASE_FOLDER || 'laera-ia').replace(/^\/+|\/+$/g, '')
const UPLOAD_ROOT = process.env.UPLOAD_ROOT || path.join(process.cwd(), 'uploads')

const IMAGE_FIELDS = ['previewImageUrl', 'previewImageMasterUrl', 'previewImageCardUrl', 'previewImageDetailUrl']

function requireEnv(name, value) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
}

function normalizeUploadUrl(url) {
  if (!url || typeof url !== 'string') return null
  const clean = url.trim().split('?')[0]
  if (!clean.startsWith('/uploads/')) return null
  return clean
}

function isPendingUrl(url) {
  return url.startsWith('/uploads/pending/')
}

function localPathFromUploadUrl(url) {
  const relative = url.replace(/^\/uploads\//, '')
  return path.join(UPLOAD_ROOT, relative)
}

function publicIdFromUploadUrl(url) {
  const relative = url.replace(/^\/uploads\//, '')
  const noExt = relative.replace(/\.[a-zA-Z0-9]+$/, '')
  return `${CLOUDINARY_BASE_FOLDER}/${noExt}`
}

async function exists(filePath) {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

async function uploadBufferToCloudinary(buffer, publicId) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: 'image',
        overwrite: true,
        invalidate: true,
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(error || new Error('Cloudinary upload failed'))
          return
        }
        resolve(result.secure_url)
      },
    )
    stream.end(buffer)
  })
}

async function main() {
  requireEnv('DATABASE_URL', process.env.DATABASE_URL)
  requireEnv('CLOUDINARY_CLOUD_NAME', CLOUDINARY_CLOUD_NAME)
  requireEnv('CLOUDINARY_API_KEY', CLOUDINARY_API_KEY)
  requireEnv('CLOUDINARY_API_SECRET', CLOUDINARY_API_SECRET)

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  })

  console.info(`[migrate] mode=${DRY_RUN ? 'dry-run' : 'apply'} includePending=${INCLUDE_PENDING ? 'yes' : 'no'}`)
  console.info(`[migrate] upload root: ${UPLOAD_ROOT}`)
  console.info(`[migrate] cloudinary folder: ${CLOUDINARY_BASE_FOLDER}`)

  const prompts = await prisma.prompt.findMany({
    select: {
      id: true,
      slug: true,
      status: true,
      previewImageUrl: true,
      previewImageMasterUrl: true,
      previewImageCardUrl: true,
      previewImageDetailUrl: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  const urlCache = new Map()
  let scanned = 0
  let migratedFields = 0
  let updatedPrompts = 0
  let skippedPending = 0
  let missingFiles = 0

  for (const prompt of prompts) {
    scanned += 1
    const data = {}

    for (const field of IMAGE_FIELDS) {
      const rawUrl = prompt[field]
      const uploadUrl = normalizeUploadUrl(rawUrl)
      if (!uploadUrl) continue

      if (isPendingUrl(uploadUrl) && !INCLUDE_PENDING) {
        skippedPending += 1
        continue
      }

      if (urlCache.has(uploadUrl)) {
        data[field] = urlCache.get(uploadUrl)
        migratedFields += 1
        continue
      }

      const localPath = localPathFromUploadUrl(uploadUrl)
      const found = await exists(localPath)
      if (!found) {
        missingFiles += 1
        console.warn(`[migrate] missing file: ${localPath} (prompt=${prompt.slug} field=${field})`)
        continue
      }

      const publicIdBase = publicIdFromUploadUrl(uploadUrl)
      const publicId = `${publicIdBase}-${randomUUID().slice(0, 8)}`

      if (DRY_RUN) {
        const simulatedUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${publicId}.webp`
        urlCache.set(uploadUrl, simulatedUrl)
        data[field] = simulatedUrl
        migratedFields += 1
        continue
      }

      const buffer = await readFile(localPath)
      const cloudUrl = await uploadBufferToCloudinary(buffer, publicId)
      urlCache.set(uploadUrl, cloudUrl)
      data[field] = cloudUrl
      migratedFields += 1
      console.info(`[migrate] uploaded ${uploadUrl} -> ${cloudUrl}`)
    }

    if (Object.keys(data).length > 0) {
      if (!DRY_RUN) {
        await prisma.prompt.update({
          where: { id: prompt.id },
          data,
        })
      }
      updatedPrompts += 1
    }
  }

  console.info('[migrate] done')
  console.info(`[migrate] prompts scanned: ${scanned}`)
  console.info(`[migrate] prompt rows touched: ${updatedPrompts}`)
  console.info(`[migrate] image fields migrated: ${migratedFields}`)
  console.info(`[migrate] pending fields skipped: ${skippedPending}`)
  console.info(`[migrate] missing local files: ${missingFiles}`)
  console.info(`[migrate] unique upload URLs processed: ${urlCache.size}`)
}

main()
  .catch((error) => {
    console.error('[migrate] failed:', error?.message || error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
