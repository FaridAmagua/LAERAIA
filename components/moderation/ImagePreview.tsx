'use client'

type ImagePreviewProps = {
  src?: string
  alt: string
}

export default function ImagePreview({ src, alt }: ImagePreviewProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/70">
      {src ? (
        <img src={src} alt={alt} className="h-40 w-full object-cover" loading="lazy" />
      ) : (
        <div className="flex h-40 items-center justify-center text-xs text-slate-400">No preview</div>
      )}
    </div>
  )
}
