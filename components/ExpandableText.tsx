'use client'

import { useMemo, useState } from 'react'

type ExpandableTextProps = {
  text: string
  maxChars?: number
  locale?: 'es' | 'en'
  className?: string
}

export default function ExpandableText({ text, maxChars = 220, locale = 'es', className = '' }: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false)
  const normalized = text.trim()

  const { needsToggle, preview } = useMemo(() => {
    if (normalized.length <= maxChars) {
      return { needsToggle: false, preview: normalized }
    }

    return { needsToggle: true, preview: normalized.slice(0, maxChars).trimEnd() + '…' }
  }, [normalized, maxChars])

  if (!normalized) {
    return <p className={className}>{locale === 'es' ? 'Sin descripcion.' : 'No description provided.'}</p>
  }

  return (
    <div className="space-y-2">
      <p className={className}>{expanded || !needsToggle ? normalized : preview}</p>
      {needsToggle && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="text-xs font-medium text-cyan-300 hover:text-cyan-200"
        >
          {expanded ? (locale === 'es' ? 'Ver menos' : 'Show less') : locale === 'es' ? 'Ver mas' : 'Show more'}
        </button>
      )}
    </div>
  )
}
