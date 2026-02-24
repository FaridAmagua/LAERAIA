import { notFound } from 'next/navigation'
import type { Locale } from './types'

export const locales: Locale[] = ['es', 'en']

export const localeLabels: Record<Locale, string> = {
  es: 'Español',
  en: 'English',
}

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale)
}

export function assertLocale(value: string): Locale {
  if (!isLocale(value)) {
    notFound()
  }

  return value
}

export function withLocalePath(locale: Locale, path = ''): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `/${locale}${normalized}`
}
