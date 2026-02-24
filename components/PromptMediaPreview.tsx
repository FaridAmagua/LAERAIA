import type { PromptSummary } from '@/lib/types'

type PromptMediaPreviewProps = {
  prompt: Pick<PromptSummary, 'title' | 'previewImageUrl' | 'previewImageMasterUrl' | 'previewImageCardUrl' | 'previewImageDetailUrl' | 'previewFocusY' | 'type'>
  mode?: 'card' | 'detail' | 'gallery'
}

export default function PromptMediaPreview({ prompt, mode = 'card' }: PromptMediaPreviewProps) {
  const imageUrl =
    mode === 'detail'
      ? prompt.previewImageDetailUrl || prompt.previewImageMasterUrl || prompt.previewImageCardUrl || prompt.previewImageUrl
      : prompt.previewImageMasterUrl || prompt.previewImageCardUrl || prompt.previewImageUrl

  const frameClass = mode === 'detail' ? 'aspect-[16/10] md:aspect-video' : mode === 'gallery' ? '' : 'aspect-[16/10]'
  const focusY = Number.isFinite(prompt.previewFocusY) ? Math.min(100, Math.max(0, prompt.previewFocusY)) : 50

  const frameBaseClass =
    mode === 'gallery'
      ? 'relative overflow-hidden rounded-none bg-slate-950/30'
      : 'relative overflow-hidden rounded-xl border border-cyan-400/30 bg-slate-950/60 shadow-[0_0_0_1px_rgba(34,211,238,0.12)]'

  if (!imageUrl) {
    return (
      <div className={`${frameBaseClass} ${frameClass || 'aspect-[4/5]'}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.24),transparent_45%)]" />
        <div className="absolute bottom-3 left-3 rounded-full border border-white/20 bg-black/30 px-2 py-1 text-xs text-slate-200">{prompt.type.toUpperCase()}</div>
      </div>
    )
  }

  return (
    <div className={`${frameBaseClass} ${frameClass}`}>
      <img
        src={imageUrl}
        alt={prompt.title}
        className={mode === 'gallery' ? 'max-h-[560px] w-full object-contain' : 'h-full w-full object-cover'}
        style={mode === 'gallery' ? undefined : { objectPosition: `50% ${focusY}%` }}
        loading="lazy"
      />
      <div className={`absolute inset-0 ${mode === 'gallery' ? 'bg-gradient-to-t from-black/20 via-transparent to-transparent' : 'bg-gradient-to-t from-black/55 via-transparent to-transparent'}`} />
      {mode !== 'gallery' && <div className="absolute bottom-3 left-3 rounded-full border border-white/20 bg-black/40 px-2 py-1 text-xs text-white">Image</div>}
    </div>
  )
}
