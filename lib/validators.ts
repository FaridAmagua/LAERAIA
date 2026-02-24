import { z } from 'zod'
import { PROMPT_CATEGORY_OPTIONS, PROMPT_MOOD_OPTIONS, PROMPT_STYLE_OPTIONS, PROMPT_TAG_OPTIONS, PROMPT_TOOL_OPTIONS } from './promptOptions'

const urlSchema = z.string().url().max(1000)
const durationSchema = z.string().trim().max(30).optional().or(z.literal('')).transform((value) => value?.trim() || 'N/A')
const previewFocusXSchema = z.coerce.number().int().min(0).max(100).default(50)
const previewFocusYSchema = z.coerce.number().int().min(0).max(100).default(50)
const previewScaleSchema = z.coerce.number().int().min(100).max(220).default(100)

export const localeSchema = z.enum(['es', 'en'])
export const promptTypeSchema = z.enum(['video', 'image', 'seo'])

export const listPromptsQuerySchema = z.object({
  locale: localeSchema.default('es'),
  type: promptTypeSchema.optional(),
  tag: z.string().min(1).max(50).optional(),
  collection: z.string().trim().min(1).max(80).optional(),
  search: z.string().min(1).max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
})

export const promptBySlugQuerySchema = z.object({
  locale: localeSchema.default('es'),
})

export const createPromptSchema = z.object({
  locale: localeSchema,
  type: promptTypeSchema,
  title: z.string().trim().min(4).max(120),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  promptText: z.string().trim().min(10).max(5000),
  category: z.enum(PROMPT_CATEGORY_OPTIONS),
  collection: z.string().trim().min(1).max(80).default('general'),
  style: z.enum(PROMPT_STYLE_OPTIONS),
  mood: z.enum(PROMPT_MOOD_OPTIONS),
  duration: durationSchema,
  tags: z.array(z.enum(PROMPT_TAG_OPTIONS)).max(12).default([]),
  tool: z.enum(PROMPT_TOOL_OPTIONS),
  youtubeUrl: z.string().trim().max(1000).optional().or(z.literal('')),
  resultUrl: urlSchema.optional().or(z.literal('')),
  previewImageUrl: z.string().trim().min(1).max(1000),
  previewFocusX: previewFocusXSchema,
  previewFocusY: previewFocusYSchema,
  previewScale: previewScaleSchema,
  source: z.enum(['official', 'community']).default('community'),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
})

export const voteParamsSchema = z.object({
  id: z.string().cuid(),
})

export const submissionFieldsSchema = z.object({
  locale: localeSchema,
  type: promptTypeSchema,
  title: z.string().trim().min(4).max(120),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  promptText: z.string().trim().min(10).max(5000),
  category: z.enum(PROMPT_CATEGORY_OPTIONS),
  collection: z.string().trim().min(1).max(80).default('general'),
  style: z.enum(PROMPT_STYLE_OPTIONS),
  mood: z.enum(PROMPT_MOOD_OPTIONS),
  duration: durationSchema,
  tags: z.array(z.enum(PROMPT_TAG_OPTIONS)).max(12).default([]),
  tool: z.enum(PROMPT_TOOL_OPTIONS),
  youtubeUrl: z.string().trim().max(1000).optional().or(z.literal('')),
  resultUrl: urlSchema.optional().or(z.literal('')),
  previewFocusX: previewFocusXSchema,
  previewFocusY: previewFocusYSchema,
  previewScale: previewScaleSchema,
})

export const adminPreviewUpdateSchema = z.object({
  previewImageUrl: z.string().min(1).max(1000),
})

export const adminUpdatePromptSchema = z.object({
  locale: localeSchema,
  type: promptTypeSchema,
  title: z.string().trim().min(4).max(120),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  promptText: z.string().trim().min(10).max(5000),
  category: z.string().trim().min(1).max(80),
  collection: z.string().trim().min(1).max(80).default('general'),
  style: z.string().trim().min(1).max(80),
  mood: z.string().trim().min(1).max(80),
  duration: durationSchema,
  tags: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  tool: z.string().trim().min(1).max(80),
  youtubeUrl: z.string().trim().max(1000).optional().or(z.literal('')),
  resultUrl: urlSchema.optional().or(z.literal('')),
  previewFocusX: previewFocusXSchema,
  previewFocusY: previewFocusYSchema,
  previewScale: previewScaleSchema,
  translation: z
    .object({
      locale: localeSchema,
      title: z.string().trim().min(4).max(120),
      description: z.string().trim().max(1000).optional().or(z.literal('')),
      promptText: z.string().trim().min(10).max(5000),
    })
    .optional(),
})


