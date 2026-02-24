'use client'

import { useMemo } from 'react'
import type { Locale } from '@/lib/types'
import { localeLabels, withLocalePath } from '@/lib/i18n'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type LanguageSwitcherProps = {
  locale: Locale
}

export default function LanguageSwitcher({ locale }: LanguageSwitcherProps) {
  const pathname = usePathname()
  const suffix = useMemo(() => {
    const cleaned = pathname ?? '/es'
    const parts = cleaned.split('/').filter(Boolean)
    if (parts.length === 0) {
      return ''
    }

    return `/${parts.slice(1).join('/')}`
  }, [pathname])

  const targetLocale: Locale = locale === 'es' ? 'en' : 'es'

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 p-1 text-xs">
      <span className="rounded-full bg-white/10 px-3 py-1 font-medium text-white">{localeLabels[locale]}</span>
      <Link href={withLocalePath(targetLocale, suffix)} className="rounded-full px-3 py-1 text-slate-300 transition hover:bg-white/10 hover:text-white">
        {localeLabels[targetLocale]}
      </Link>
    </div>
  )
}
