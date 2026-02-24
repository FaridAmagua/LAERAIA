'use client'

import { useEffect, useState } from 'react'
import {
  PROMPT_CATEGORY_OPTIONS,
  PROMPT_MOOD_OPTIONS,
  PROMPT_STYLE_OPTIONS,
  PROMPT_TAG_OPTIONS,
  PROMPT_TOOL_OPTIONS,
} from '@/lib/promptOptions'
import type { PromptSummary } from '@/lib/types'

type PendingResponse = {
  items: PromptSummary[]
}

type EditDraft = {
  locale: 'es' | 'en'
  type: 'video' | 'image' | 'seo'
  title: string
  description: string
  promptText: string
  category: string
  style: string
  mood: string
  duration: string
  tool: string
  youtubeUrl: string
  resultUrl: string
  tags: string[]
}

export default function AdminModerationClient() {
  const [items, setItems] = useState<PromptSummary[]>([])
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [loadingList, setLoadingList] = useState(false)
  const [message, setMessage] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<EditDraft | null>(null)
  const [view, setView] = useState<'pending' | 'approved'>('pending')
  const [newPreviewFile, setNewPreviewFile] = useState<File | null>(null)

  async function loadItems(status: 'pending' | 'approved'): Promise<void> {
    setLoadingList(true)
    setMessage('')

    try {
      const response = await fetch(`/api/admin/prompts?status=${status}&limit=120`, { cache: 'no-store' })

      if (!response.ok) {
        setMessage('Failed to load prompts.')
        return
      }

      const data = (await response.json()) as PendingResponse
      setItems(data.items)
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    loadItems(view).catch(() => {
      setMessage('Failed to load prompts.')
    })
  }, [view])

  function startEdit(item: PromptSummary): void {
    setEditingId(item.id)
    setNewPreviewFile(null)
    setDraft({
      locale: item.locale,
      type: item.type,
      title: item.title,
      description: item.description ?? '',
      promptText: item.promptText,
      category: item.category,
      style: item.style,
      mood: item.mood,
      duration: item.duration === 'N/A' ? '' : item.duration,
      tool: item.tool ?? '',
      youtubeUrl: item.youtubeUrl ?? '',
      resultUrl: item.resultUrl ?? '',
      tags: item.tags ?? [],
    })
  }

  async function saveEdit(id: string): Promise<void> {
    if (!draft) {
      return
    }

    setLoadingId(id)
    setMessage('')

    try {
      const response = await fetch(`/api/admin/prompts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      })

      const data = (await response.json().catch(() => null)) as { error?: string; details?: { fieldErrors?: Record<string, string[]> } } | null
      if (!response.ok) {
        const firstFieldError = data?.details?.fieldErrors ? Object.values(data.details.fieldErrors).flat()[0] : ''
        setMessage(firstFieldError || data?.error || 'Failed to update prompt.')
        return
      }

      await loadItems(view)
      setEditingId(null)
      setDraft(null)
      setMessage('Prompt updated.')
    } finally {
      setLoadingId(null)
    }
  }

  async function uploadPreview(id: string): Promise<void> {
    if (!newPreviewFile) {
      setMessage('Select an image first.')
      return
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(newPreviewFile.type)) {
      setMessage('Invalid format. Only JPG, PNG or WEBP.')
      return
    }

    if (newPreviewFile.size <= 0 || newPreviewFile.size > 10 * 1024 * 1024) {
      setMessage('Image size must be 10MB or less.')
      return
    }

    setLoadingId(id)
    setMessage('')

    try {
      const formData = new FormData()
      formData.append('file', newPreviewFile)

      const response = await fetch(`/api/admin/prompts/${id}/preview`, {
        method: 'POST',
        body: formData,
      })

      const data = (await response.json().catch(() => null)) as { error?: string; message?: string } | null
      if (!response.ok) {
        setMessage(data?.error || 'Failed to update preview image.')
        return
      }

      setMessage(data?.message || 'Preview image updated.')
      setNewPreviewFile(null)
      await loadItems(view)
    } finally {
      setLoadingId(null)
    }
  }

  async function moderate(id: string, action: 'approve' | 'reject'): Promise<void> {
    setLoadingId(id)

    try {
      const response = await fetch(`/api/admin/prompts/${id}/${action}`, { method: 'POST' })

      if (!response.ok) {
        setMessage(`Failed to ${action} prompt.`)
        return
      }

      if (view === 'pending' && action === 'approve') {
        setItems((prev) => prev.filter((item) => item.id !== id))
      } else {
        await loadItems(view)
      }
      setMessage(`Prompt ${action}d.`)
    } finally {
      setLoadingId(null)
    }
  }

  async function logout(): Promise<void> {
    await fetch('/api/admin/session', { method: 'DELETE' })
    window.location.reload()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => loadItems(view)}
          disabled={loadingList}
          className="rounded-full bg-cyan-400 px-4 py-2 text-xs font-semibold text-slate-950 disabled:opacity-70"
        >
          {loadingList ? 'Loading...' : 'Refresh'}
        </button>
        <button
          type="button"
          onClick={() => {
            setView('pending')
            setEditingId(null)
            setDraft(null)
          }}
          className={`rounded-full px-4 py-2 text-xs font-semibold ${view === 'pending' ? 'bg-emerald-400 text-slate-950' : 'border border-white/20 text-slate-200'}`}
        >
          Pending
        </button>
        <button
          type="button"
          onClick={() => {
            setView('approved')
            setEditingId(null)
            setDraft(null)
          }}
          className={`rounded-full px-4 py-2 text-xs font-semibold ${view === 'approved' ? 'bg-emerald-400 text-slate-950' : 'border border-white/20 text-slate-200'}`}
        >
          Approved
        </button>
        <button
          type="button"
          onClick={logout}
          className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-slate-200"
        >
          Logout
        </button>
      </div>

      {message && <p className="text-sm text-slate-300">{message}</p>}

      {items.length === 0 ? (
        <p className="text-sm text-slate-300">{view === 'pending' ? 'No pending prompts.' : 'No approved prompts.'}</p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <article key={item.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
              <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/60">
                  {view === 'pending' ? (
                    <img src={`/api/admin/prompts/${item.id}/pending-image?variant=master`} alt={item.title} className="aspect-[16/9] w-full object-contain" loading="lazy" />
                  ) : (
                    <img src={item.previewImageMasterUrl || item.previewImageUrl} alt={item.title} className="aspect-[16/9] w-full object-contain" loading="lazy" />
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-100">{item.title}</h3>
                  <p className="mt-1 max-w-full break-words text-sm leading-relaxed text-slate-300">
                    {item.description}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {item.locale} | {item.type} | {item.source}
                  </p>
                  {item.youtubeUrl && (
                    <a href={item.youtubeUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-cyan-300">
                      YouTube preview
                    </a>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={loadingId === item.id}
                      onClick={() => startEdit(item)}
                      className="rounded-full bg-amber-400 px-4 py-2 text-xs font-semibold text-slate-950 disabled:opacity-70"
                    >
                      Edit
                    </button>
                    {view === 'pending' && (
                      <>
                        <button
                          type="button"
                          disabled={loadingId === item.id}
                          onClick={() => moderate(item.id, 'approve')}
                          className="rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-slate-950 disabled:opacity-70"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={loadingId === item.id}
                          onClick={() => moderate(item.id, 'reject')}
                          className="rounded-full bg-rose-400 px-4 py-2 text-xs font-semibold text-slate-950 disabled:opacity-70"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>

                  {editingId === item.id && draft ? (
                    <div className="mt-4 space-y-3 rounded-xl border border-amber-300/30 bg-slate-950/40 p-3">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          disabled={loadingId === item.id}
                          onClick={() => {
                            setEditingId(null)
                            setDraft(null)
                            setNewPreviewFile(null)
                          }}
                          className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-slate-200 disabled:opacity-70"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <label className="text-xs text-slate-300">
                          Title
                          <input
                            value={draft.title}
                            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                            className="mt-1 w-full rounded-lg border border-white/15 bg-slate-950/60 px-2 py-1.5 text-sm text-slate-100"
                          />
                        </label>
                        <label className="text-xs text-slate-300">
                          Locale
                          <select
                            value={draft.locale}
                            onChange={(event) => setDraft({ ...draft, locale: event.target.value as 'es' | 'en' })}
                            className="mt-1 w-full rounded-lg border border-white/15 bg-slate-950/60 px-2 py-1.5 text-sm text-slate-100"
                          >
                            <option value="es">es</option>
                            <option value="en">en</option>
                          </select>
                        </label>
                        <label className="text-xs text-slate-300">
                          Type
                          <select
                            value={draft.type}
                            onChange={(event) => setDraft({ ...draft, type: event.target.value as 'video' | 'image' | 'seo' })}
                            className="mt-1 w-full rounded-lg border border-white/15 bg-slate-950/60 px-2 py-1.5 text-sm text-slate-100"
                          >
                            <option value="video">video</option>
                            <option value="image">image</option>
                            <option value="seo">seo</option>
                          </select>
                        </label>
                        <label className="text-xs text-slate-300">
                          Category
                          <select
                            value={draft.category}
                            onChange={(event) => setDraft({ ...draft, category: event.target.value })}
                            className="mt-1 w-full rounded-lg border border-white/15 bg-slate-950/60 px-2 py-1.5 text-sm text-slate-100"
                          >
                            {PROMPT_CATEGORY_OPTIONS.map((value) => (
                              <option key={value} value={value}>
                                {value}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="text-xs text-slate-300">
                          Style
                          <select
                            value={draft.style}
                            onChange={(event) => setDraft({ ...draft, style: event.target.value })}
                            className="mt-1 w-full rounded-lg border border-white/15 bg-slate-950/60 px-2 py-1.5 text-sm text-slate-100"
                          >
                            {PROMPT_STYLE_OPTIONS.map((value) => (
                              <option key={value} value={value}>
                                {value}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="text-xs text-slate-300">
                          Mood
                          <select
                            value={draft.mood}
                            onChange={(event) => setDraft({ ...draft, mood: event.target.value })}
                            className="mt-1 w-full rounded-lg border border-white/15 bg-slate-950/60 px-2 py-1.5 text-sm text-slate-100"
                          >
                            {PROMPT_MOOD_OPTIONS.map((value) => (
                              <option key={value} value={value}>
                                {value}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="text-xs text-slate-300">
                          Tool
                          <select
                            value={draft.tool}
                            onChange={(event) => setDraft({ ...draft, tool: event.target.value })}
                            className="mt-1 w-full rounded-lg border border-white/15 bg-slate-950/60 px-2 py-1.5 text-sm text-slate-100"
                          >
                            {PROMPT_TOOL_OPTIONS.map((value) => (
                              <option key={value} value={value}>
                                {value}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="text-xs text-slate-300">
                          Duration
                          <input
                            value={draft.duration}
                            onChange={(event) => setDraft({ ...draft, duration: event.target.value })}
                            className="mt-1 w-full rounded-lg border border-white/15 bg-slate-950/60 px-2 py-1.5 text-sm text-slate-100"
                          />
                        </label>
                        <label className="text-xs text-slate-300">
                          YouTube URL
                          <input
                            value={draft.youtubeUrl}
                            onChange={(event) => setDraft({ ...draft, youtubeUrl: event.target.value })}
                            className="mt-1 w-full rounded-lg border border-white/15 bg-slate-950/60 px-2 py-1.5 text-sm text-slate-100"
                          />
                        </label>
                        <label className="text-xs text-slate-300">
                          Result URL
                          <input
                            value={draft.resultUrl}
                            onChange={(event) => setDraft({ ...draft, resultUrl: event.target.value })}
                            className="mt-1 w-full rounded-lg border border-white/15 bg-slate-950/60 px-2 py-1.5 text-sm text-slate-100"
                          />
                        </label>
                      </div>

                      <label className="block text-xs text-slate-300">
                        Description
                        <textarea
                          rows={2}
                          value={draft.description}
                          onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                          className="mt-1 w-full rounded-lg border border-white/15 bg-slate-950/60 px-2 py-1.5 text-sm text-slate-100"
                        />
                      </label>

                      <label className="block text-xs text-slate-300">
                        Prompt
                        <textarea
                          rows={6}
                          value={draft.promptText}
                          onChange={(event) => setDraft({ ...draft, promptText: event.target.value })}
                          className="mt-1 w-full rounded-lg border border-white/15 bg-slate-950/60 px-2 py-1.5 text-sm text-slate-100"
                        />
                      </label>

                      <fieldset className="space-y-2 text-xs text-slate-300">
                        <legend>Tags</legend>
                        <div className="grid grid-cols-2 gap-2 rounded-lg border border-white/10 bg-slate-950/50 p-2 md:grid-cols-4">
                          {PROMPT_TAG_OPTIONS.map((tag) => {
                            const checked = draft.tags.includes(tag)
                            return (
                              <label key={tag} className="inline-flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(event) => {
                                    if (event.target.checked) {
                                      setDraft({ ...draft, tags: [...draft.tags, tag] })
                                      return
                                    }
                                    setDraft({ ...draft, tags: draft.tags.filter((item) => item !== tag) })
                                  }}
                                  className="h-3.5 w-3.5 accent-cyan-400"
                                />
                                <span>{tag}</span>
                              </label>
                            )
                          })}
                        </div>
                      </fieldset>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={loadingId === item.id}
                          onClick={() => saveEdit(item.id)}
                          className="rounded-full bg-cyan-400 px-4 py-2 text-xs font-semibold text-slate-950 disabled:opacity-70"
                        >
                          Save changes
                        </button>
                        <button
                          type="button"
                          disabled={loadingId === item.id}
                          onClick={() => {
                            setEditingId(null)
                            setDraft(null)
                            setNewPreviewFile(null)
                          }}
                          className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-slate-200 disabled:opacity-70"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="space-y-2 rounded-lg border border-white/10 bg-slate-950/50 p-3">
                        <p className="text-xs text-slate-300">Replace preview image (JPG/PNG/WEBP, max 10MB)</p>
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(event) => setNewPreviewFile(event.target.files?.[0] ?? null)}
                            className="max-w-sm rounded-lg border border-white/15 bg-slate-950/60 px-2 py-1.5 text-xs text-slate-200 file:mr-2 file:rounded-full file:border-0 file:bg-cyan-400 file:px-3 file:py-1 file:font-semibold file:text-slate-950"
                          />
                          <button
                            type="button"
                            disabled={loadingId === item.id}
                            onClick={() => uploadPreview(item.id)}
                            className="rounded-full bg-violet-400 px-4 py-2 text-xs font-semibold text-slate-950 disabled:opacity-70"
                          >
                            Update image
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-white/10 bg-slate-950/50 p-3 text-xs text-slate-300">
                      {item.promptText}
                    </pre>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

