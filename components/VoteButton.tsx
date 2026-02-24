'use client'

import { useState } from 'react'

type VoteButtonProps = {
  promptId: string
  initialVotes: number
  compact?: boolean
}

export default function VoteButton({ promptId, initialVotes, compact = false }: VoteButtonProps) {
  const [votes, setVotes] = useState(initialVotes)
  const [loading, setLoading] = useState(false)

  async function handleToggle(): Promise<void> {
    if (loading) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/prompts/${promptId}/vote`, {
        method: 'POST',
      })

      if (!response.ok) {
        return
      }

      const data = (await response.json()) as { votes: number }
      setVotes(data.votes)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={`rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70 ${
        compact ? '' : 'min-w-[100px]'
      }`}
    >
      ▲ {votes}
    </button>
  )
}
