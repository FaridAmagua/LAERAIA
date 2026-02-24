'use client'

import { promptTypes, typeLabel } from '@/lib/promptTypes'
import {
  PROMPT_CATEGORY_OPTIONS,
  PROMPT_MOOD_OPTIONS,
  PROMPT_STYLE_OPTIONS,
  PROMPT_TAG_OPTIONS,
  PROMPT_TOOL_OPTIONS,
  categoryPlaceholder,
  moodPlaceholder,
  stylePlaceholder,
  toolPlaceholder,
} from '@/lib/promptOptions'
import type { Locale, PromptFormInput } from '@/lib/types'
import { useState } from 'react'

type PromptFormProps = {
  locale: Locale
}

const initialValues: PromptFormInput = {
  locale: 'es',
  title: '',
  description: '',
  promptText: '',
  type: 'video',
  category: '',
  collection: 'general',
  style: '',
  mood: '',
  duration: '',
  tags: [],
  tool: '',
  youtubeUrl: '',
  resultUrl: '',
  previewFocusX: 50,
  previewFocusY: 50,
  previewScale: 100,
}

function isValidUrl(value: string): boolean {
  if (!value.trim()) {
    return false
  }

  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export default function PromptForm({ locale }: PromptFormProps) {
  const [values, setValues] = useState<PromptFormInput>({ ...initialValues, locale })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function setError(textEs: string, textEn: string): void {
    setMessage({ type: 'error', text: locale === 'es' ? textEs : textEn })
  }

  function setSuccess(textEs: string, textEn: string): void {
    setMessage({ type: 'success', text: locale === 'es' ? textEs : textEn })
  }

  function toUserError(apiError: string): string {
    if (apiError.includes('Image size must be >0 and <= 10MB')) {
      return locale === 'es' ? 'La imagen debe pesar 10MB o menos.' : 'Image size must be 10MB or less.'
    }

    if (apiError.includes('Invalid image type')) {
      return locale === 'es' ? 'Formato inválido. Solo JPG, PNG o WEBP.' : 'Invalid format. Only JPG, PNG or WEBP.'
    }

    if (apiError.includes('Image is too small')) {
      return locale === 'es' ? 'La imagen es demasiado pequeña (mínimo 300px de ancho).' : 'Image is too small (minimum 300px width).'
    }

    return apiError
  }

  function update<K extends keyof PromptFormInput>(key: K, value: PromptFormInput[K]): void {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()

    const requiredTextValid =
      values.title.trim() &&
      values.promptText.trim() &&
      values.category.trim() &&
      values.style.trim() &&
      values.mood.trim() &&
      values.tool.trim()

    if (!requiredTextValid || !imageFile) {
      setError('Completa campos obligatorios y sube una imagen.', 'Complete required fields and upload an image.')
      return
    }

    if (values.resultUrl && !isValidUrl(values.resultUrl)) {
      setError('El enlace de resultado debe ser una URL valida.', 'Result link must be a valid URL.')
      return
    }

    setIsSubmitting(true)

    try {
      if (imageFile.size <= 0 || imageFile.size > 10 * 1024 * 1024) {
        setError('La imagen debe pesar 10MB o menos.', 'Image size must be 10MB or less.')
        return
      }

      if (!['image/jpeg', 'image/png', 'image/webp'].includes(imageFile.type)) {
        setError('Formato inválido. Solo JPG, PNG o WEBP.', 'Invalid format. Only JPG, PNG or WEBP.')
        return
      }

      const formData = new FormData()
      formData.append('locale', values.locale)
      formData.append('type', values.type)
      formData.append('title', values.title.trim())
      formData.append('description', values.description.trim())
      formData.append('promptText', values.promptText.trim())
      formData.append('category', values.category)
      formData.append('collection', values.collection.trim() || 'general')
      formData.append('style', values.style)
      formData.append('mood', values.mood)
      formData.append('duration', values.duration.trim())
      formData.append('tool', values.tool)
      formData.append('youtubeUrl', values.youtubeUrl.trim())
      formData.append('resultUrl', values.resultUrl.trim())
      formData.append('previewFocusX', String(values.previewFocusX))
      formData.append('previewFocusY', String(values.previewFocusY))
      formData.append('previewScale', String(values.previewScale))
      formData.append('tags', values.tags.join(','))
      formData.append('image', imageFile)

      const response = await fetch('/api/submissions', {
        method: 'POST',
        body: formData,
      })

      const data = (await response.json().catch(() => null)) as { message?: string; error?: string } | null

      if (!response.ok) {
        const rawError = data?.message || data?.error
        setMessage({
          type: 'error',
          text: rawError ? toUserError(rawError) : locale === 'es' ? 'No se pudo enviar el prompt.' : 'Prompt submission failed.',
        })
        return
      }

      setValues({ ...initialValues, locale })
      setImageFile(null)
      const successText = data?.message || (locale === 'es' ? 'Prompt enviado correctamente.' : 'Prompt submitted successfully.')
      setSuccess(successText, successText)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/70 p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-slate-200 md:col-span-2">
          <span>{locale === 'es' ? 'Titulo' : 'Title'} *</span>
          <input required value={values.title} onChange={(event) => update('title', event.target.value)} className="w-full rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400" />
        </label>

        <label className="space-y-2 text-sm text-slate-200 md:col-span-2">
          <span>{locale === 'es' ? 'Descripcion (opcional)' : 'Description (optional)'}</span>
          <textarea value={values.description} onChange={(event) => update('description', event.target.value)} rows={3} className="w-full rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400" />
        </label>

        <label className="space-y-2 text-sm text-slate-200">
          <span>Type *</span>
          <select value={values.type} onChange={(event) => update('type', event.target.value as PromptFormInput['type'])} className="w-full rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400">
            {promptTypes.map((item) => (
              <option key={item} value={item}>{typeLabel(item, locale)}</option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm text-slate-200">
          <span>{locale === 'es' ? 'Categoria' : 'Category'} *</span>
          <select required value={values.category} onChange={(event) => update('category', event.target.value)} className="w-full rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400">
            <option value="">{categoryPlaceholder(locale)}</option>
            {PROMPT_CATEGORY_OPTIONS.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm text-slate-200">
          <span>{locale === 'es' ? 'Coleccion' : 'Collection'}</span>
          <input
            value={values.collection}
            onChange={(event) => update('collection', event.target.value)}
            placeholder={locale === 'es' ? 'ej: ascensor, anime' : 'e.g. elevator, anime'}
            className="w-full rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
          />
        </label>

        <label className="space-y-2 text-sm text-slate-200">
          <span>{locale === 'es' ? 'Estilo' : 'Style'} *</span>
          <select required value={values.style} onChange={(event) => update('style', event.target.value)} className="w-full rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400">
            <option value="">{stylePlaceholder(locale)}</option>
            {PROMPT_STYLE_OPTIONS.map((style) => (
              <option key={style} value={style}>{style}</option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm text-slate-200">
          <span>Mood *</span>
          <select required value={values.mood} onChange={(event) => update('mood', event.target.value)} className="w-full rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400">
            <option value="">{moodPlaceholder(locale)}</option>
            {PROMPT_MOOD_OPTIONS.map((mood) => (
              <option key={mood} value={mood}>{mood}</option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm text-slate-200">
          <span>{locale === 'es' ? 'Duracion (opcional)' : 'Duration (optional)'}</span>
          <input value={values.duration} onChange={(event) => update('duration', event.target.value)} placeholder="8s" className="w-full rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400" />
        </label>

        <label className="space-y-2 text-sm text-slate-200">
          <span>{locale === 'es' ? 'Herramienta' : 'Tool'} *</span>
          <select required value={values.tool} onChange={(event) => update('tool', event.target.value)} className="w-full rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400">
            <option value="">{toolPlaceholder(locale)}</option>
            {PROMPT_TOOL_OPTIONS.map((tool) => (
              <option key={tool} value={tool}>{tool}</option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm text-slate-200">
          <span>{locale === 'es' ? 'Encuadre vertical (preview)' : 'Vertical framing (preview)'}</span>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={values.previewFocusY}
            onChange={(event) => update('previewFocusY', Number(event.target.value))}
            className="w-full accent-cyan-400"
          />
          <p className="text-xs text-slate-400">{values.previewFocusY}%</p>
        </label>

        <label className="space-y-2 text-sm text-slate-200">
          <span>YouTube URL ({locale === 'es' ? 'opcional' : 'optional'})</span>
          <input value={values.youtubeUrl} onChange={(event) => update('youtubeUrl', event.target.value)} placeholder="https://youtube.com/watch?v=..." className="w-full rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400" />
        </label>

        <label className="space-y-2 text-sm text-slate-200">
          <span>{locale === 'es' ? 'Enlace de resultado' : 'Result link'}</span>
          <input type="url" value={values.resultUrl} onChange={(event) => update('resultUrl', event.target.value)} placeholder="https://" className="w-full rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400" />
        </label>

        <fieldset className="space-y-2 text-sm text-slate-200 md:col-span-2">
          <legend>Tags</legend>
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/15 bg-slate-950/40 p-3 md:grid-cols-4">
            {PROMPT_TAG_OPTIONS.map((tag) => {
              const checked = values.tags.includes(tag)

              return (
                <label key={tag} className="inline-flex items-center gap-2 text-xs text-slate-200">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => {
                      if (event.target.checked) {
                        update('tags', [...values.tags, tag])
                        return
                      }

                      update('tags', values.tags.filter((item) => item !== tag))
                    }}
                    className="h-3.5 w-3.5 accent-cyan-400"
                  />
                  <span>{tag}</span>
                </label>
              )
            })}
          </div>
        </fieldset>
      </div>

      <label className="block space-y-2 text-sm text-slate-200">
        <span>{locale === 'es' ? 'Prompt principal' : 'Main prompt'} *</span>
        <textarea required value={values.promptText} onChange={(event) => update('promptText', event.target.value)} rows={7} className="w-full rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400" />
      </label>

      <label className="block space-y-2 text-sm text-slate-200">
        <span>{locale === 'es' ? 'Imagen preview (JPG/PNG/WEBP, max 10MB)' : 'Preview image (JPG/PNG/WEBP, max 10MB)'} *</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null
            setImageFile(file)
            setMessage(null)
          }}
          className="w-full rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2 text-slate-100 outline-none file:mr-3 file:rounded-full file:border-0 file:bg-cyan-400 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-slate-950"
        />
      </label>

      <button type="submit" disabled={isSubmitting} className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70">
        {isSubmitting ? (locale === 'es' ? 'Enviando...' : 'Submitting...') : locale === 'es' ? 'Enviar prompt' : 'Submit prompt'}
      </button>

      {message && (
        <p className={`text-sm ${message.type === 'error' ? 'text-rose-300' : 'text-emerald-300'}`}>
          {message.text}
        </p>
      )}
    </form>
  )
}

