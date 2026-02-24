import type { Locale } from './types'

export const PROMPT_CATEGORY_OPTIONS = [
  'Creatividad',
  'SEO',
  'Diseno',
  'Contenido',
  'Ecommerce',
  'Marketing',
  'Publicidad',
  'Social Media',
  'Storytelling',
  'Productividad',
] as const

export const PROMPT_TOOL_OPTIONS = [
  'Higgsfield',
  'Kling',
  'Runway',
  'Pika',
  'Luma Dream Machine',
  'Sora',
  'Midjourney',
  'DALL-E 3',
  'FLUX',
  'Stable Diffusion',
] as const

export const PROMPT_STYLE_OPTIONS = [
  'Cinematico',
  'Fotografico',
  'Editorial',
  'Documental',
  'Realista',
  'Minimalista',
  'Comercial',
  'Anime',
  '3D',
  'Ilustracion',
] as const

export const PROMPT_MOOD_OPTIONS = [
  'Calido',
  'Energetico',
  'Serio',
  'Inspirador',
  'Persuasivo',
  'Premium',
  'Educativo',
  'Neutral',
] as const

export const PROMPT_TAG_OPTIONS = [
  'seo',
  'ecommerce',
  'marketing',
  'copy',
  'producto',
  'creativo',
  'imagen',
  'video',
  'social-media',
  'storytelling',
  'ads',
  'branding',
] as const

export function categoryPlaceholder(locale: Locale): string {
  return locale === 'es' ? 'Selecciona una categoria' : 'Select a category'
}

export function toolPlaceholder(locale: Locale): string {
  return locale === 'es' ? 'Selecciona una herramienta' : 'Select a tool'
}

export function stylePlaceholder(locale: Locale): string {
  return locale === 'es' ? 'Selecciona un estilo' : 'Select a style'
}

export function moodPlaceholder(locale: Locale): string {
  return locale === 'es' ? 'Selecciona un mood' : 'Select a mood'
}
