export type Locale = 'es' | 'en'

export type PromptType = 'video' | 'image' | 'seo'

export type PromptSource = 'official' | 'community'

export type PromptStatus = 'pending' | 'approved' | 'rejected'

export type PromptSummary = {
  id: string
  slug: string
  locale: Locale
  type: PromptType
  title: string
  description: string
  promptText: string
  category: string
  collection: string
  style: string
  mood: string
  duration: string
  tags: string[]
  tool?: string | null
  previewImageUrl: string
  previewImageMasterUrl: string
  previewImageCardUrl: string
  previewImageDetailUrl: string
  previewFocusX: number
  previewFocusY: number
  previewScale: number
  youtubeUrl?: string | null
  resultUrl?: string | null
  source: PromptSource
  status: PromptStatus
  createdAt: string
  updatedAt: string
  voteCount: number
}

export type PromptDetail = PromptSummary & {
  settingsJson?: Record<string, unknown> | null
}

export type BlogPostSummary = {
  slug: string
  title: string
  excerpt: string
  createdAt: string
}

export type BlogPostDetail = BlogPostSummary & {
  bodyHtml: string
}

export type PromptFormInput = {
  locale: Locale
  type: PromptType
  title: string
  description: string
  promptText: string
  category: string
  collection: string
  style: string
  mood: string
  duration: string
  tags: string[]
  tool: string
  youtubeUrl: string
  resultUrl: string
  previewFocusX: number
  previewFocusY: number
  previewScale: number
}
