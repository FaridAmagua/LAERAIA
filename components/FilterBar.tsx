'use client'

type FilterValues = {
  query: string
  category: string
  collection: string
  style: string
  mood: string
}

type FilterBarProps = {
  values: FilterValues
  options: {
    categories: string[]
    collections: string[]
    styles: string[]
    moods: string[]
  }
  labels: {
    searchPlaceholder: string
    category: string
    collection: string
    style: string
    mood: string
    all: string
  }
  onChange: (next: FilterValues) => void
}

export default function FilterBar({ values, options, labels, onChange }: FilterBarProps) {
  return (
    <div className="grid gap-3 rounded-2xl border border-white/10 bg-slate-900/70 p-4 md:grid-cols-5">
      <input
        value={values.query}
        onChange={(event) => onChange({ ...values, query: event.target.value })}
        placeholder={labels.searchPlaceholder}
        className="rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-400 focus:border-cyan-400"
      />

      <select
        value={values.category}
        onChange={(event) => onChange({ ...values, category: event.target.value })}
        className="rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
      >
        <option value="">{labels.category}: {labels.all}</option>
        {options.categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>

      <select
        value={values.collection}
        onChange={(event) => onChange({ ...values, collection: event.target.value })}
        className="rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
      >
        <option value="">{labels.collection}: {labels.all}</option>
        {options.collections.map((collection) => (
          <option key={collection} value={collection}>
            {collection}
          </option>
        ))}
      </select>

      <select
        value={values.style}
        onChange={(event) => onChange({ ...values, style: event.target.value })}
        className="rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
      >
        <option value="">{labels.style}: {labels.all}</option>
        {options.styles.map((style) => (
          <option key={style} value={style}>
            {style}
          </option>
        ))}
      </select>

      <select
        value={values.mood}
        onChange={(event) => onChange({ ...values, mood: event.target.value })}
        className="rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
      >
        <option value="">{labels.mood}: {labels.all}</option>
        {options.moods.map((mood) => (
          <option key={mood} value={mood}>
            {mood}
          </option>
        ))}
      </select>
    </div>
  )
}
