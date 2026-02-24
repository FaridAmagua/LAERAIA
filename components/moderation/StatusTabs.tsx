'use client'

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected'

type StatusTabsProps = {
  value: StatusFilter
  onChange: (value: StatusFilter) => void
}

const tabs: Array<{ key: StatusFilter; label: string; icon: string }> = [
  { key: 'all', label: 'Todos', icon: '◉' },
  { key: 'pending', label: 'Pendientes', icon: '◌' },
  { key: 'approved', label: 'Aprobados', icon: '✓' },
  { key: 'rejected', label: 'Rechazados', icon: '✕' },
]

export default function StatusTabs({ value, onChange }: StatusTabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const active = tab.key === value
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              active ? 'bg-cyan-400 text-slate-950 shadow-[0_0_0_1px_rgba(34,211,238,0.4)]' : 'border border-white/15 bg-slate-900/60 text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span className="mr-2 text-xs">{tab.icon}</span>
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

export type { StatusFilter }
