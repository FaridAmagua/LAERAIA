'use client'

import { useMemo, useState } from 'react'
import type { Locale, PromptSummary, PromptType } from '@/lib/types'
import PromptCard from './PromptCard'
import FilterBar from './FilterBar'

type PromptsListClientProps = {
  locale: Locale
  initialPrompts: PromptSummary[]
  forcedType?: PromptType
}

export default function PromptsListClient({ locale, initialPrompts, forcedType }: PromptsListClientProps) {
  const [filters, setFilters] = useState({ query: '', category: '', collection: '', style: '', mood: '' })

  const prompts = useMemo(() => {
    if (!forcedType) {
      return initialPrompts
    }

    return initialPrompts.filter((item) => item.type === forcedType)
  }, [forcedType, initialPrompts])

  const options = useMemo(() => {
    const categories = Array.from(new Set(prompts.map((item) => item.category).filter(Boolean))).sort()
    const collections = Array.from(new Set(prompts.map((item) => item.collection).filter(Boolean))).sort()
    const styles = Array.from(new Set(prompts.map((item) => item.style).filter(Boolean))).sort()
    const moods = Array.from(new Set(prompts.map((item) => item.mood).filter(Boolean))).sort()

    return { categories, collections, styles, moods }
  }, [prompts])

  const filtered = useMemo(() => {
    return prompts.filter((item) => {
      if (filters.category && item.category !== filters.category) {
        return false
      }

      if (filters.style && item.style !== filters.style) {
        return false
      }

      if (filters.collection && item.collection !== filters.collection) {
        return false
      }

      if (filters.mood && item.mood !== filters.mood) {
        return false
      }

      if (!filters.query) {
        return true
      }

      const query = filters.query.toLowerCase()
      return [item.title, item.description, item.promptText, item.tool ?? ''].join(' ').toLowerCase().includes(query)
    })
  }, [filters, prompts])

  return (
    <section className="space-y-6">
      <FilterBar
        values={filters}
        options={options}
        labels={{
          searchPlaceholder: locale === 'es' ? 'Buscar prompt o palabra clave...' : 'Search prompt or keyword...',
          category: locale === 'es' ? 'Categoria' : 'Category',
          collection: locale === 'es' ? 'Coleccion' : 'Collection',
          style: locale === 'es' ? 'Estilo' : 'Style',
          mood: 'Mood',
          all: locale === 'es' ? 'Todas' : 'All',
        }}
        onChange={setFilters}
      />

      <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {filtered.map((prompt) => (
          <PromptCard key={prompt.id} prompt={prompt} locale={locale} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="rounded-xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-300">
          {locale === 'es' ? 'No hay prompts con esos filtros.' : 'No prompts match these filters.'}
        </p>
      )}
    </section>
  )
}
