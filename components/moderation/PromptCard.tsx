'use client'

import { useMemo, useState } from 'react'
import {
  PROMPT_CATEGORY_OPTIONS,
  PROMPT_MOOD_OPTIONS,
  PROMPT_STYLE_OPTIONS,
  PROMPT_TAG_OPTIONS,
  PROMPT_TOOL_OPTIONS,
} from '@/lib/promptOptions'
import type { PromptSummary } from '@/lib/types'
import PromptCardActions from './PromptCardActions'
import ImagePreview from './ImagePreview'
import YouTubePreview from './YouTubePreview'

type PromptCardProps = {
  item: PromptSummary
  onChanged: () => Promise<void>
  availableTags: string[]
}

type EditDraft = {
  locale: 'es' | 'en'
  type: 'video' | 'image' | 'seo'
  title: string
  description: string
  promptText: string
  category: string
  collection: string
  style: string
  mood: string
  duration: string
  tool: string
  youtubeUrl: string
  resultUrl: string
  tags: string[]
  previewFocusX: number
  previewFocusY: number
  previewScale: number
}

type TranslationDraft = {
  title: string
  description: string
  promptText: string
}

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

function normalizeTags(input: string): string[] {
  return Array.from(
    new Set(
      input
        .split(',')
        .map((tag) => normalizeTag(tag))
        .filter(Boolean),
    ),
  ).slice(0, 12)
}

export default function PromptCard({ item, onChanged, availableTags }: PromptCardProps) {
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(false)
  const [message, setMessage] = useState('')
  const [newImageFile, setNewImageFile] = useState<File | null>(null)

  const previewImageSrc = item.previewImageMasterUrl || item.previewImageCardUrl || item.previewImageUrl

  const [draft, setDraft] = useState<EditDraft>({
    locale: item.locale,
    type: item.type,
    title: item.title,
    description: item.description ?? '',
    promptText: item.promptText,
    category: item.category,
    collection: item.collection || 'general',
    style: item.style,
    mood: item.mood,
    duration: item.duration === 'N/A' ? '' : item.duration,
    tool: item.tool || PROMPT_TOOL_OPTIONS[0],
    youtubeUrl: item.youtubeUrl || '',
    resultUrl: item.resultUrl || '',
    tags: (item.tags || []).map((tag) => normalizeTag(tag)).filter(Boolean),
    previewFocusX: item.previewFocusX ?? 50,
    previewFocusY: item.previewFocusY ?? 50,
    previewScale: item.previewScale ?? 100,
  })

  const [translationDraft, setTranslationDraft] = useState<TranslationDraft>({
    title: '',
    description: '',
    promptText: '',
  })

  const translationLocale: 'es' | 'en' = draft.locale === 'es' ? 'en' : 'es'
  const mainLocaleLabel = draft.locale === 'es' ? 'Español' : 'English'
  const translationLocaleLabel = translationLocale === 'es' ? 'Español' : 'English'

  const tagsInputValue = useMemo(() => draft.tags.join(', '), [draft.tags])
  const tagSuggestions = useMemo(() => {
    return Array.from(
      new Set([...PROMPT_TAG_OPTIONS, ...availableTags, ...draft.tags].map((tag) => normalizeTag(tag)).filter(Boolean)),
    ).sort()
  }, [availableTags, draft.tags])

  const statusClass =
    item.status === 'approved'
      ? 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30'
      : item.status === 'rejected'
        ? 'bg-rose-400/20 text-rose-300 border-rose-400/30'
        : 'bg-amber-400/20 text-amber-300 border-amber-400/30'

  async function request(url: string, method: 'POST' | 'PATCH' | 'DELETE', body?: unknown): Promise<{ ok: boolean; data?: Record<string, unknown> | null }> {
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      })

      const data = (await response.json().catch(() => null)) as
        | {
            error?: string
            details?: { fieldErrors?: Record<string, string[]> }
          }
        | null

      if (!response.ok) {
        const firstFieldError = data?.details?.fieldErrors ? Object.values(data.details.fieldErrors).flat()[0] : ''
        setMessage(firstFieldError || data?.error || 'Request failed')
        return { ok: false, data }
      }

      await onChanged()
      return { ok: true, data }
    } finally {
      setBusy(false)
    }
  }

  async function uploadPreviewImage(): Promise<boolean> {
    if (!newImageFile) {
      setMessage('Selecciona una imagen primero.')
      return false
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(newImageFile.type)) {
      setMessage('Formato invalido. Usa JPG, PNG o WEBP.')
      return false
    }

    if (newImageFile.size <= 0 || newImageFile.size > 10 * 1024 * 1024) {
      setMessage('La imagen debe pesar 10MB o menos.')
      return false
    }

    setBusy(true)
    setMessage('')
    try {
      const formData = new FormData()
      formData.append('file', newImageFile)

      const response = await fetch(`/api/admin/prompts/${item.id}/preview`, {
        method: 'POST',
        body: formData,
      })

      const data = (await response.json().catch(() => null)) as { error?: string; message?: string } | null
      if (!response.ok) {
        setMessage(data?.error || 'No se pudo reemplazar la imagen.')
        return false
      }

      setMessage(data?.message || 'Imagen actualizada.')
      setNewImageFile(null)
      await onChanged()
      return true
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-[0_12px_30px_rgba(2,6,23,0.35)]">
      <div className="grid gap-4 md:grid-cols-[260px_1fr]">
        <ImagePreview src={item.previewImageMasterUrl || item.previewImageUrl} alt={item.title} />

        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-slate-100">{item.title}</h3>
            <span className={`rounded-full border px-2 py-1 text-[11px] font-medium uppercase ${statusClass}`}>{item.status}</span>
          </div>

          <p className="text-xs text-slate-400">{item.locale} | {item.type} | {item.source} | {item.collection || 'general'} | {item.style}</p>

          {!editing ? (
            <>
              <p className="mt-3 max-w-full whitespace-pre-wrap break-words text-sm text-slate-300">
                {item.promptText.slice(0, 320)}
                {item.promptText.length > 320 ? '...' : ''}
              </p>
              {item.tags.length > 0 && <p className="mt-2 text-xs text-cyan-200">Tags: {item.tags.join(', ')}</p>}
            </>
          ) : (
            <div className="mt-3 space-y-2 rounded-xl border border-white/10 bg-slate-950/40 p-3">
              <div className="grid gap-2 md:grid-cols-2">
                <label className="text-xs text-slate-300">
                  Idioma principal
                  <input
                    value={`${mainLocaleLabel} (${draft.locale})`}
                    disabled
                    className="mt-1 w-full rounded-lg border border-white/15 bg-slate-800 px-3 py-2 text-sm text-slate-300"
                  />
                </label>
                <label className="text-xs text-slate-300">
                  Tipo
                  <select
                    value={draft.type}
                    onChange={(event) => setDraft((prev) => ({ ...prev, type: event.target.value as 'video' | 'image' | 'seo' }))}
                    className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                  >
                    <option value="video">video</option>
                    <option value="image">image</option>
                    <option value="seo">seo</option>
                  </select>
                </label>
              </div>

              <div className="rounded-lg border border-cyan-400/30 bg-slate-950/70 p-2">
                <p className="text-xs text-cyan-200">Contenido principal: {mainLocaleLabel}</p>
              </div>

              <input
                value={draft.title}
                onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
                className="w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-slate-100"
              />
              <textarea
                rows={2}
                value={draft.description}
                onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
                className="w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-slate-100"
              />
              <textarea
                rows={6}
                value={draft.promptText}
                onChange={(event) => setDraft((prev) => ({ ...prev, promptText: event.target.value }))}
                className="w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-slate-100"
              />

              <div className="grid gap-2 md:grid-cols-2">
                <label className="text-xs text-slate-300">
                  Categoria
                  <select
                    value={draft.category}
                    onChange={(event) => setDraft((prev) => ({ ...prev, category: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                  >
                    {PROMPT_CATEGORY_OPTIONS.map((value) => (
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
                    onChange={(event) => setDraft((prev) => ({ ...prev, mood: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                  >
                    {PROMPT_MOOD_OPTIONS.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-2 md:grid-cols-3">
                <label className="text-xs text-slate-300">
                  Coleccion
                  <input
                    value={draft.collection}
                    onChange={(event) => setDraft((prev) => ({ ...prev, collection: event.target.value }))}
                    placeholder="ej: oscuros, elegantes"
                    className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                  />
                </label>

                <label className="text-xs text-slate-300">
                  Estilo
                  <input
                    list={`style-options-${item.id}`}
                    value={draft.style}
                    onChange={(event) => setDraft((prev) => ({ ...prev, style: event.target.value }))}
                    placeholder="ej: oscuro, elegante"
                    className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                  />
                  <datalist id={`style-options-${item.id}`}>
                    {PROMPT_STYLE_OPTIONS.map((value) => (
                      <option key={value} value={value} />
                    ))}
                  </datalist>
                </label>

                <label className="text-xs text-slate-300">
                  Duracion
                  <input
                    value={draft.duration}
                    onChange={(event) => setDraft((prev) => ({ ...prev, duration: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                  />
                </label>
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                <label className="text-xs text-slate-300">
                  Tool
                  <select
                    value={draft.tool}
                    onChange={(event) => setDraft((prev) => ({ ...prev, tool: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                  >
                    {PROMPT_TOOL_OPTIONS.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs text-slate-300">
                  Tags (coma separadas)
                  <input
                    list={`tag-options-${item.id}`}
                    value={tagsInputValue}
                    onChange={(event) => setDraft((prev) => ({ ...prev, tags: normalizeTags(event.target.value) }))}
                    placeholder="seo, marketing, social-media"
                    className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                  />
                  <datalist id={`tag-options-${item.id}`}>
                    {tagSuggestions.map((tag) => (
                      <option key={tag} value={tag} />
                    ))}
                  </datalist>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-lg border border-white/10 bg-slate-950/50 p-2 md:grid-cols-4">
                {tagSuggestions.map((tag) => {
                  const checked = draft.tags.includes(tag)
                  return (
                    <label key={tag} className="inline-flex items-center gap-2 text-xs text-slate-300">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => {
                          if (event.target.checked) {
                            setDraft((prev) => ({ ...prev, tags: normalizeTags([...prev.tags, tag].join(', ')) }))
                            return
                          }
                          setDraft((prev) => ({ ...prev, tags: prev.tags.filter((itemTag) => itemTag !== tag) }))
                        }}
                        className="h-3.5 w-3.5 accent-cyan-400"
                      />
                      <span>{tag}</span>
                    </label>
                  )
                })}
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                <label className="text-xs text-slate-300">
                  YouTube URL
                  <input
                    value={draft.youtubeUrl}
                    onChange={(event) => setDraft((prev) => ({ ...prev, youtubeUrl: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                  />
                </label>

                <label className="text-xs text-slate-300">
                  Result URL
                  <input
                    value={draft.resultUrl}
                    onChange={(event) => setDraft((prev) => ({ ...prev, resultUrl: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                  />
                </label>
              </div>

              <div className="rounded-lg border border-cyan-400/30 bg-slate-950/70 p-2">
                <p className="mb-2 text-xs text-cyan-200">Traduccion obligatoria: {translationLocaleLabel} ({translationLocale})</p>
                <div className="space-y-2">
                  <input
                    value={translationDraft.title}
                    onChange={(event) => setTranslationDraft((prev) => ({ ...prev, title: event.target.value }))}
                    placeholder={`Titulo ${translationLocaleLabel}`}
                    className="w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                  />
                  <textarea
                    rows={2}
                    value={translationDraft.description}
                    onChange={(event) => setTranslationDraft((prev) => ({ ...prev, description: event.target.value }))}
                    placeholder={`Descripcion ${translationLocaleLabel}`}
                    className="w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                  />
                  <textarea
                    rows={4}
                    value={translationDraft.promptText}
                    onChange={(event) => setTranslationDraft((prev) => ({ ...prev, promptText: event.target.value }))}
                    placeholder={`Prompt ${translationLocaleLabel}`}
                    className="w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-cyan-400/30 bg-slate-950/70 p-2">
                <p className="mb-2 text-[11px] text-cyan-200">Ajuste SOLO para carrusel de Home</p>
                <p className="mb-2 text-[11px] text-slate-400">Estas opciones no cambian las cards fuera del carrusel.</p>
              </div>

              <label className="text-xs text-slate-300">
                Posicion horizontal (X): {draft.previewFocusX}% (0 = izquierda, 100 = derecha)
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={draft.previewFocusX}
                  onChange={(event) => setDraft((prev) => ({ ...prev, previewFocusX: Number(event.target.value) }))}
                  className="mt-1 w-full accent-cyan-400"
                />
              </label>

              <label className="text-xs text-slate-300">
                Posicion vertical (Y): {draft.previewFocusY}% (0 = arriba/cabeza, 100 = abajo/pies)
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={draft.previewFocusY}
                  onChange={(event) => setDraft((prev) => ({ ...prev, previewFocusY: Number(event.target.value) }))}
                  className="mt-1 w-full accent-cyan-400"
                />
              </label>

              <label className="text-xs text-slate-300">
                Escala de imagen: {draft.previewScale}%
                <input
                  type="range"
                  min={100}
                  max={220}
                  step={1}
                  value={draft.previewScale}
                  onChange={(event) => setDraft((prev) => ({ ...prev, previewScale: Number(event.target.value) }))}
                  className="mt-1 w-full accent-cyan-400"
                />
              </label>

              <div className="rounded-lg border border-cyan-400/30 bg-slate-950/70 p-2">
                <p className="mb-2 text-[11px] text-slate-400">Vista previa exacta card Home (Trending)</p>
                <div className="grid gap-3 md:grid-cols-[260px_1fr]">
                  <div className="relative h-[360px] w-[260px] overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
                    <img
                      src={previewImageSrc}
                      alt={`${item.title} preview home`}
                      className="h-full w-full object-cover"
                      style={{
                        objectPosition: `${draft.previewFocusX}% ${draft.previewFocusY}%`,
                        transform: `scale(${Math.max(100, draft.previewScale) / 100})`,
                        transformOrigin: '50% 50%',
                      }}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                    <div className="absolute inset-x-3 bottom-3">
                      <p className="line-clamp-2 text-xs font-semibold text-white">{draft.title || item.title}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-slate-950/60 p-2">
                <p className="mb-2 text-[11px] text-slate-400">Reemplazar imagen preview (JPG/PNG/WEBP, max 10MB)</p>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => setNewImageFile(event.target.files?.[0] ?? null)}
                    className="max-w-xs rounded-lg border border-white/15 bg-slate-900 px-2 py-1.5 text-xs text-slate-200 file:mr-2 file:rounded-full file:border-0 file:bg-cyan-400 file:px-3 file:py-1 file:font-semibold file:text-slate-950"
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={uploadPreviewImage}
                    className="rounded-full bg-violet-400 px-3 py-1.5 text-xs font-semibold text-slate-950 disabled:opacity-60"
                  >
                    Update image
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    if (translationDraft.title.trim().length < 4 || translationDraft.promptText.trim().length < 10) {
                      setMessage('Completa titulo y prompt en ambos idiomas antes de guardar.')
                      return
                    }

                    const ok = await request(`/api/admin/prompts/${item.id}`, 'PATCH', {
                      locale: draft.locale,
                      type: draft.type,
                      title: draft.title,
                      description: draft.description,
                      promptText: draft.promptText,
                      category: draft.category,
                      collection: draft.collection || 'general',
                      style: draft.style,
                      mood: draft.mood,
                      duration: draft.duration,
                      tags: draft.tags,
                      tool: draft.tool,
                      youtubeUrl: draft.youtubeUrl,
                      resultUrl: draft.resultUrl,
                      previewFocusX: draft.previewFocusX,
                      previewFocusY: draft.previewFocusY,
                      previewScale: draft.previewScale,
                      translation: {
                        locale: translationLocale,
                        title: translationDraft.title,
                        description: translationDraft.description,
                        promptText: translationDraft.promptText,
                      },
                    })
                    if (ok.ok) {
                      setEditing(false)
                    }
                  }}
                  className="rounded-full bg-cyan-400 px-4 py-1.5 text-xs font-semibold text-slate-950 disabled:opacity-60"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setEditing(false)
                    setNewImageFile(null)
                    setDraft({
                      locale: item.locale,
                      type: item.type,
                      title: item.title,
                      description: item.description ?? '',
                      promptText: item.promptText,
                      category: item.category,
                      collection: item.collection || 'general',
                      style: item.style,
                      mood: item.mood,
                      duration: item.duration === 'N/A' ? '' : item.duration,
                      tool: item.tool || PROMPT_TOOL_OPTIONS[0],
                      youtubeUrl: item.youtubeUrl || '',
                      resultUrl: item.resultUrl || '',
                      tags: (item.tags || []).map((tag) => normalizeTag(tag)).filter(Boolean),
                      previewFocusX: item.previewFocusX ?? 50,
                      previewFocusY: item.previewFocusY ?? 50,
                      previewScale: item.previewScale ?? 100,
                    })
                    setTranslationDraft({
                      title: '',
                      description: '',
                      promptText: '',
                    })
                  }}
                  className="rounded-full border border-white/20 px-4 py-1.5 text-xs text-slate-200 disabled:opacity-60"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <PromptCardActions
            status={item.status}
            busy={busy}
            onEdit={() => setEditing((prev) => !prev)}
            onDuplicate={async () => {
              const duplicated = await request(`/api/admin/prompts/${item.id}/duplicate`, 'POST')
              if (duplicated.ok) {
                const slug = typeof duplicated.data?.slug === 'string' ? duplicated.data.slug : ''
                setMessage(slug ? `Duplicado creado: ${slug}` : 'Duplicado creado correctamente.')
              }
            }}
            onApprove={() => request(`/api/admin/prompts/${item.id}/approve`, 'POST')}
            onReject={() => request(`/api/admin/prompts/${item.id}/reject`, 'POST')}
            onDelete={() => request(`/api/admin/prompts/${item.id}`, 'DELETE')}
          />

          {item.type === 'video' && item.youtubeUrl && <YouTubePreview youtubeUrl={item.youtubeUrl} />}
          {message && <p className="mt-2 text-xs text-rose-300">{message}</p>}
        </div>
      </div>
    </article>
  )
}
