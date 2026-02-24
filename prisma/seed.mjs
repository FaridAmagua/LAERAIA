import 'dotenv/config'
import path from 'node:path'
import { mkdir } from 'node:fs/promises'
import sharp from 'sharp'
import { PrismaClient, PromptSource, PromptStatus, PromptType, Locale } from '@prisma/client'

const prisma = new PrismaClient()

const UPLOAD_ROOT = process.env.UPLOAD_ROOT || path.join(process.cwd(), 'uploads')
const APPROVED_DIR = path.join(UPLOAD_ROOT, 'approved')
const APPROVED_MASTER_DIR = path.join(APPROVED_DIR, 'master')
const APPROVED_CARD_DIR = path.join(APPROVED_DIR, 'card')
const APPROVED_DETAIL_DIR = path.join(APPROVED_DIR, 'detail')

async function ensureSeedPreview(baseName, color) {
  await mkdir(APPROVED_DIR, { recursive: true })
  await mkdir(APPROVED_MASTER_DIR, { recursive: true })
  await mkdir(APPROVED_CARD_DIR, { recursive: true })
  await mkdir(APPROVED_DETAIL_DIR, { recursive: true })

  const fileName = `${baseName}.webp`

  await sharp({
    create: {
      width: 2000,
      height: 1400,
      channels: 3,
      background: color,
    },
  })
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(path.join(APPROVED_MASTER_DIR, fileName))

  await sharp({
    create: {
      width: 2000,
      height: 1400,
      channels: 3,
      background: color,
    },
  })
    .resize({ width: 800, height: 450, fit: 'cover', position: 'attention', withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(path.join(APPROVED_CARD_DIR, fileName))

  await sharp({
    create: {
      width: 2000,
      height: 1400,
      channels: 3,
      background: color,
    },
  })
    .resize({ width: 1080, height: 1920, fit: 'cover', position: 'attention', withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(path.join(APPROVED_DETAIL_DIR, fileName))

  return {
    master: `/uploads/approved/master/${fileName}`,
    card: `/uploads/approved/card/${fileName}`,
    detail: `/uploads/approved/detail/${fileName}`,
  }
}

const basePrompts = [
  {
    slug: 'descripcion-creativa-producto-video',
    locale: Locale.es,
    type: PromptType.video,
    title: 'Descripcion creativa para producto',
    description: 'Prompt para generar anuncios de producto en video con narrativa emocional corta.',
    promptText:
      'Crea un video publicitario vertical de 8 segundos para una vela aromatica de lavanda hecha a mano. Incluye plano detalle del encendido, atmosfera nocturna calida y cierre con CTA suave orientada a ecommerce.',
    category: 'Creatividad',
    style: 'Cinematico',
    mood: 'Calido',
    duration: '8s',
    tags: ['copy', 'producto', 'creativo'],
    tool: 'Higgsfield',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    resultUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    settingsJson: { duration: '8s', style: 'Cinematico', mood: 'Calido' },
    source: PromptSource.official,
    status: PromptStatus.approved,
    createdAt: new Date('2026-02-01T10:00:00Z'),
    previewKey: 'seed-descripcion-video',
    previewColor: '#1f2937',
  },
  {
    slug: 'titulo-seo-ecommerce',
    locale: Locale.es,
    type: PromptType.seo,
    title: 'Mejorar titulo SEO para ecommerce',
    description: 'Prompt para crear titulos SEO claros y con intencion comercial para fichas de producto.',
    promptText:
      "Genera 5 variaciones de titulo SEO para Auriculares Xeno 300 (inalambricos, cancelacion de ruido, 30h de bateria). Maximo 70 caracteres e incluye la keyword 'auriculares inalambricos'.",
    category: 'SEO',
    style: 'Editorial',
    mood: 'Persuasivo',
    duration: 'N/A',
    tags: ['seo', 'ecommerce', 'marketing'],
    tool: 'Higgsfield',
    youtubeUrl: null,
    resultUrl: 'https://example.com/seo-result',
    settingsJson: { style: 'Editorial', mood: 'Persuasivo' },
    source: PromptSource.official,
    status: PromptStatus.approved,
    createdAt: new Date('2026-01-20T10:00:00Z'),
    previewKey: 'seed-seo-ecommerce',
    previewColor: '#164e63',
  },
  {
    slug: 'hero-imagen-producto',
    locale: Locale.es,
    type: PromptType.image,
    title: 'Prompt para imagen hero de producto',
    description: 'Prompt para generar imagen hero premium de ecommerce con direccion de arte clara.',
    promptText:
      'Genera una imagen hero de ecommerce para un reloj inteligente minimalista sobre superficie de piedra negra, iluminacion lateral suave, sombra definida, composicion limpia y fondo degradado antracita.',
    category: 'Diseno',
    style: 'Fotografico',
    mood: 'Premium',
    duration: 'N/A',
    tags: ['imagen', 'producto', 'ecommerce'],
    tool: 'Midjourney',
    youtubeUrl: null,
    resultUrl: 'https://example.com/image/hero-producto',
    settingsJson: { style: 'Fotografico', mood: 'Premium' },
    source: PromptSource.official,
    status: PromptStatus.approved,
    createdAt: new Date('2026-02-10T10:00:00Z'),
    previewKey: 'seed-hero-imagen',
    previewColor: '#1e3a8a',
  },
  {
    slug: 'seo-title-ecommerce-en',
    locale: Locale.en,
    type: PromptType.seo,
    title: 'Improve Ecommerce Product Title for SEO',
    description: 'Prompt to generate concise and high-intent product titles for ecommerce pages.',
    promptText:
      "Generate 5 SEO title options for Xeno 300 Headphones. Keep each title under 70 characters and include the keyword 'wireless headphones'.",
    category: 'SEO',
    style: 'Editorial',
    mood: 'Persuasivo',
    duration: 'N/A',
    tags: ['seo', 'ecommerce'],
    tool: 'Higgsfield',
    youtubeUrl: null,
    resultUrl: 'https://example.com/seo-title-en',
    settingsJson: { style: 'Editorial', mood: 'Persuasivo' },
    source: PromptSource.official,
    status: PromptStatus.approved,
    createdAt: new Date('2026-01-15T10:00:00Z'),
    previewKey: 'seed-seo-en',
    previewColor: '#3f3f46',
  },
]

async function main() {
  for (const basePrompt of basePrompts) {
    const preview = await ensureSeedPreview(basePrompt.previewKey, basePrompt.previewColor)
    const { previewKey, previewColor, ...prompt } = basePrompt

    await prisma.prompt.upsert({
      where: { slug: prompt.slug },
      update: {
        ...prompt,
        previewImageUrl: preview.card,
        previewImageMasterUrl: preview.master,
        previewImageCardUrl: preview.card,
        previewImageDetailUrl: preview.detail,
      },
      create: {
        ...prompt,
        previewImageUrl: preview.card,
        previewImageMasterUrl: preview.master,
        previewImageCardUrl: preview.card,
        previewImageDetailUrl: preview.detail,
      },
    })
  }

  console.log(`Seeded ${basePrompts.length} prompts`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
