'use client'

import { useMemo, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import type { Locale, PromptSummary } from '@/lib/types'
import { typeLabel } from '@/lib/promptTypes'

type TrendingPromptsClientProps = {
  locale: Locale
  prompts: PromptSummary[]
  maxItems?: number
  showDescription?: boolean
}

export default function TrendingPromptsClient({ locale, prompts, maxItems, showDescription = true }: TrendingPromptsClientProps) {
  const items = typeof maxItems === 'number' ? prompts.slice(0, maxItems) : prompts
  const [isHovering, setIsHovering] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const loopItems = useMemo(() => {
    if (items.length === 0) {
      return []
    }

    if (items.length === 1) {
      return [items[0], items[0], items[0], items[0]]
    }

    return [...items, ...items]
  }, [items])

  if (items.length === 0) {
    return <p className="text-sm text-slate-400">{locale === 'es' ? 'Sin prompts para calcular tendencia.' : 'No prompts available for trending yet.'}</p>
  }

  const paused = isHovering || selectedId !== null
  const duration = Math.max(24, items.length * 8)

  return (
    <div
      className="relative overflow-hidden"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-black to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-black to-transparent" />

      <div
        className="trending-marquee flex w-max"
        data-paused={paused ? 'true' : 'false'}
        style={{ '--marquee-duration': `${duration}s` } as CSSProperties}
      >
        {loopItems.map((prompt, index) => {
          const isSelected = selectedId === prompt.id
          const imageUrl = prompt.previewImageMasterUrl || prompt.previewImageCardUrl || prompt.previewImageUrl
          const detailsHref = `/${locale}/prompts/${prompt.slug}`

          return (
            <article
              key={`${prompt.id}-${index}`}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedId((prev) => (prev === prompt.id ? null : prompt.id))}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  setSelectedId((prev) => (prev === prompt.id ? null : prompt.id))
                }
              }}
              className={`group relative mr-4 h-[360px] w-[260px] shrink-0 cursor-pointer overflow-hidden rounded-2xl border transition ${
                isSelected ? 'border-cyan-300/80 shadow-[0_0_0_1px_rgba(103,232,249,0.45),0_18px_40px_rgba(8,145,178,0.25)]' : 'border-white/10'
              }`}
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={prompt.title}
                  className="h-full w-full object-cover transition duration-300"
                  style={{
                    objectPosition: `${prompt.previewFocusX}% ${prompt.previewFocusY}%`,
                    transform: `scale(${prompt.previewScale / 100})`,
                    transformOrigin: `${prompt.previewFocusX}% ${prompt.previewFocusY}%`,
                  }}
                  loading="lazy"
                />
              ) : (
                <div className="h-full w-full bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.25),transparent_45%),linear-gradient(180deg,#0b1220_0%,#04070d_100%)]" />
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

              <div className="absolute inset-x-3 top-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-cyan-200">
                <span>{typeLabel(prompt.type, locale)}</span>
                <span>|</span>
                <span>{prompt.source}</span>
              </div>

              <div className="absolute inset-x-3 bottom-3 space-y-2">
                <h3 className="font-heading line-clamp-2 text-sm font-semibold text-white">{prompt.title}</h3>
                {showDescription && <p className="line-clamp-2 text-xs text-slate-200">{prompt.description}</p>}
                <Link
                  href={detailsHref}
                  className="inline-flex rounded-full border border-white/30 bg-black/35 px-3 py-1 text-xs text-white transition hover:bg-white/20"
                  onClick={(event) => event.stopPropagation()}
                >
                  {locale === 'es' ? 'Ver detalle' : 'View details'}
                </Link>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}



