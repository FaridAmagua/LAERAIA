'use client'

import { useState } from 'react'

type CopyButtonProps = {
  text: string
  copiedLabel?: string
  idleLabel?: string
}

export default function CopyButton({ text, copiedLabel = 'Copiado', idleLabel = 'Copiar prompt' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy(): Promise<void> {
    if (!text) {
      return
    }

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:bg-white/20"
    >
      {copied ? copiedLabel : idleLabel}
    </button>
  )
}
