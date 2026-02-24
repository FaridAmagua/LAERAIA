'use client'

type PromptStatus = 'pending' | 'approved' | 'rejected'

type PromptCardActionsProps = {
  status: PromptStatus
  busy: boolean
  onEdit: () => void
  onDuplicate: () => void
  onApprove: () => void
  onReject: () => void
  onDelete: () => void
}

export default function PromptCardActions({ status, busy, onEdit, onDuplicate, onApprove, onReject, onDelete }: PromptCardActionsProps) {
  const canApprove = status !== 'approved'
  const canReject = status !== 'rejected'
  const canDuplicate = status === 'approved'

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <button type="button" disabled={busy} onClick={onEdit} className="rounded-full border border-white/20 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700 disabled:opacity-60">
        Editar
      </button>
      <button
        type="button"
        disabled={busy || !canDuplicate}
        onClick={onDuplicate}
        className="rounded-full border border-cyan-300/30 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-60"
      >
        Duplicar
      </button>
      <button
        type="button"
        disabled={busy || !canApprove}
        onClick={onApprove}
        className="rounded-full bg-emerald-400 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-300 disabled:opacity-60"
      >
        Aprobar
      </button>
      <button
        type="button"
        disabled={busy || !canReject}
        onClick={onReject}
        className="rounded-full bg-rose-400 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-rose-300 disabled:opacity-60"
      >
        Rechazar
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={onDelete}
        className="rounded-full border border-rose-300/40 bg-rose-950/20 px-3 py-1.5 text-xs text-rose-200 hover:bg-rose-900/40 disabled:opacity-60"
      >
        Eliminar
      </button>
    </div>
  )
}
