'use client'

import { useState } from 'react'
import type { Locale, PromptSummary } from '@/lib/types'
import Link from 'next/link'
import CopyButton from './CopyButton'
import Tag from './Tag'
import PromptMediaPreview from './PromptMediaPreview'
import VoteButton from './VoteButton'
import { typeLabel } from '@/lib/promptTypes'

type PromptCardProps = {
  prompt: PromptSummary
  locale: Locale
  showDescription?: boolean
}

export default function PromptCard({ prompt, locale, showDescription = true }: PromptCardProps) {
  const [showOverlay, setShowOverlay] = useState(false)
  const detailsHref = `/${locale}/prompts/${prompt.slug}`

  return (
    <article className="group break-inside-avoid overflow-hidden rounded-none">
      <div className="relative" onMouseEnter={() => setShowOverlay(true)} onMouseLeave={() => setShowOverlay(false)}>
        <button
          type="button"
          onClick={() => setShowOverlay((prev) => !prev)}
          className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
          aria-label={locale === 'es' ? 'Mostrar opciones del prompt' : 'Show prompt options'}
          aria-expanded={showOverlay}
        >
          <PromptMediaPreview prompt={prompt} mode="gallery" />
        </button>

        <div className={`absolute inset-0 transition duration-200 ${showOverlay ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />

          <div className="absolute inset-x-3 top-3 flex flex-wrap gap-2">
            <Tag>{typeLabel(prompt.type, locale)}</Tag>
            <Tag>{prompt.collection}</Tag>
            {prompt.source === 'community' && <Tag>community</Tag>}
          </div>

          <div className="absolute inset-x-3 bottom-3 space-y-2">
            <h3 className="font-heading line-clamp-2 text-base font-semibold text-white">{prompt.title}</h3>
            {showDescription && <p className="line-clamp-2 text-xs text-slate-200">{prompt.description}</p>}

            <div className="flex flex-wrap items-center gap-2">
              <Link href={detailsHref} className="rounded-full bg-cyan-400 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300">
                {locale === 'es' ? 'Ver detalle' : 'View details'}
              </Link>
              <CopyButton
                text={prompt.promptText}
                copiedLabel={locale === 'es' ? 'Copiado' : 'Copied'}
                idleLabel={locale === 'es' ? 'Copiar prompt' : 'Copy prompt'}
              />
              <VoteButton promptId={prompt.id} initialVotes={prompt.voteCount} compact />
              {prompt.resultUrl && (
                <a
                  href={prompt.resultUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-white/20 px-3 py-1.5 text-xs text-slate-200 transition hover:bg-white/10"
                >
                  {locale === 'es' ? 'Ver resultado' : 'See result'}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
