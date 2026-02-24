import Link from 'next/link'
import type { Locale, PromptType } from '@/lib/types'
import { typeLabel } from '@/lib/promptTypes'

type PromptTypeTabsProps = {
  locale: Locale
  active: 'all' | PromptType
}

export default function PromptTypeTabs({ locale, active }: PromptTypeTabsProps) {
  const tabs: Array<{ id: 'all' | PromptType; href: string; label: string }> = [
    { id: 'all', href: `/${locale}/prompts`, label: locale === 'es' ? 'Todos' : 'All' },
    { id: 'video', href: `/${locale}/prompts/video`, label: typeLabel('video', locale) },
    { id: 'image', href: `/${locale}/prompts/image`, label: typeLabel('image', locale) },
    { id: 'seo', href: `/${locale}/prompts/seo`, label: typeLabel('seo', locale) },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            active === tab.id ? 'bg-cyan-400 text-slate-950' : 'border border-white/15 bg-white/5 text-slate-200 hover:bg-white/10'
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  )
}
