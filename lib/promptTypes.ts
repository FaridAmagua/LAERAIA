import type { PromptType } from './types'

export const promptTypes: PromptType[] = ['video', 'image', 'seo']

export function isPromptType(value: string): value is PromptType {
  return promptTypes.includes(value as PromptType)
}

export function typeLabel(value: PromptType, locale: 'es' | 'en'): string {
  const labels = {
    es: {
      video: 'Video',
      image: 'Imagen',
      seo: 'SEO',
    },
    en: {
      video: 'Video',
      image: 'Image',
      seo: 'SEO',
    },
  }

  return labels[locale][value]
}
