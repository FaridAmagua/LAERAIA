'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { PromptSummary } from '@/lib/types'
import PromptCard from './PromptCard'
import StatusTabs, { type StatusFilter } from './StatusTabs'

type ApiResponse = {
  items: PromptSummary[]
}

const statusOrder: Array<'pending' | 'approved' | 'rejected'> = ['pending', 'approved', 'rejected']

function normalizeTag(tag: string): string {
  return tag
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

export default function ModerationPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending')
  const [quickTitle, setQuickTitle] = useState('')
  const [quickPrompt, setQuickPrompt] = useState('')
  const [quickCreating, setQuickCreating] = useState(false)

  const [itemsByStatus, setItemsByStatus] = useState<Record<'pending' | 'approved' | 'rejected', PromptSummary[]>>({
    pending: [],
    approved: [],
    rejected: [],
  })

  const loadStatus = useCallback(async (status: 'pending' | 'approved' | 'rejected') => {
    const response = await fetch(`/api/admin/prompts?status=${status}&limit=120`, { cache: 'no-store' })
    if (!response.ok) {
      throw new Error(`Failed to load ${status}`)
    }
    const data = (await response.json()) as ApiResponse
    return data.items
  }, [])

  const loadAll = useCallback(async () => {
    setLoading(true)
    setMessage('')
    try {
      const [pending, approved, rejected] = await Promise.all(statusOrder.map((status) => loadStatus(status)))
      setItemsByStatus({ pending, approved, rejected })
    } catch {
      setMessage('No se pudieron cargar los prompts de moderacion.')
    } finally {
      setLoading(false)
    }
  }, [loadStatus])

  useEffect(() => {
    loadAll().catch(() => {
      setMessage('No se pudieron cargar los prompts de moderacion.')
    })
  }, [loadAll])

  const visibleItems = useMemo(() => {
    if (statusFilter === 'all') {
      return [...itemsByStatus.pending, ...itemsByStatus.approved, ...itemsByStatus.rejected]
    }
    return itemsByStatus[statusFilter]
  }, [itemsByStatus, statusFilter])

  const tagSuggestions = useMemo(() => {
    return Array.from(
      new Set(
        [...itemsByStatus.pending, ...itemsByStatus.approved, ...itemsByStatus.rejected]
          .flatMap((item) => item.tags ?? [])
          .map((tag) => normalizeTag(tag))
          .filter(Boolean),
      ),
    ).sort()
  }, [itemsByStatus])

  async function createQuickPrompt(): Promise<void> {
    if (quickTitle.trim().length < 4 || quickPrompt.trim().length < 10) {
      setMessage('Titulo minimo 4 caracteres y prompt minimo 10 caracteres.')
      return
    }

    setQuickCreating(true)
    setMessage('')

    try {
      const response = await fetch('/api/admin/prompts/quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: quickTitle.trim(),
          promptText: quickPrompt.trim(),
          locale: 'es',
          type: 'image',
        }),
      })

      const data = (await response.json().catch(() => null)) as { error?: string; slug?: string } | null
      if (!response.ok) {
        setMessage(data?.error || 'No se pudo crear el prompt rapido.')
        return
      }

      setQuickTitle('')
      setQuickPrompt('')
      setMessage(data?.slug ? `Creado: ${data.slug}` : 'Prompt creado correctamente.')
      setStatusFilter('approved')
      await loadAll()
    } finally {
      setQuickCreating(false)
    }
  }

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-3xl font-semibold text-slate-100">Moderacion</h1>
            <p className="mt-1 text-sm text-slate-300">Revisa, edita y aprueba prompts de la comunidad.</p>
          </div>

          <button
            type="button"
            onClick={() => loadAll()}
            disabled={loading}
            className="rounded-full border border-white/20 bg-slate-800 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 disabled:opacity-60"
          >
            {loading ? 'Actualizando...' : 'Refresh'}
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-cyan-400/20 bg-slate-950/40 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cyan-200">Publicacion rapida (admin)</p>
          <div className="grid gap-2 md:grid-cols-2">
            <input
              value={quickTitle}
              onChange={(event) => setQuickTitle(event.target.value)}
              placeholder="Titulo"
              className="rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-slate-100"
            />
            <button
              type="button"
              onClick={() => createQuickPrompt()}
              disabled={quickCreating}
              className="rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
            >
              {quickCreating ? 'Creando...' : 'Crear con titulo + prompt'}
            </button>
            <textarea
              value={quickPrompt}
              onChange={(event) => setQuickPrompt(event.target.value)}
              rows={4}
              placeholder="Prompt principal"
              className="md:col-span-2 rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-slate-100"
            />
          </div>
        </div>

        <div className="mt-4">
          <StatusTabs value={statusFilter} onChange={setStatusFilter} />
        </div>
      </header>

      {message && <p className="text-sm text-rose-300">{message}</p>}

      {visibleItems.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 text-sm text-slate-300">
          No hay prompts para este filtro.
        </div>
      ) : (
        <div className="space-y-4">
          {visibleItems.map((item) => (
            <PromptCard key={item.id} item={item} onChanged={loadAll} availableTags={tagSuggestions} />
          ))}
        </div>
      )}
    </section>
  )
}
