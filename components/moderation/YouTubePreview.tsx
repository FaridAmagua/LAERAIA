'use client'

import { useMemo, useState } from 'react'

type YouTubePreviewProps = {
  youtubeUrl: string
}

function extractYouTubeId(url: string): string {
  const trimmed = url.trim()
  const short = trimmed.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/i)
  if (short?.[1]) {
    return short[1]
  }

  const watch = trimmed.match(/[?&]v=([A-Za-z0-9_-]{6,})/i)
  if (watch?.[1]) {
    return watch[1]
  }

  const embed = trimmed.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/i)
  if (embed?.[1]) {
    return embed[1]
  }

  return ''
}

export default function YouTubePreview({ youtubeUrl }: YouTubePreviewProps) {
  const [open, setOpen] = useState(false)
  const videoId = useMemo(() => extractYouTubeId(youtubeUrl), [youtubeUrl])
  const thumb = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : ''
  const embed = videoId ? `https://www.youtube.com/embed/${videoId}` : ''

  if (!videoId) {
    return null
  }

  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/50 p-3">
      <p className="mb-2 text-xs font-medium text-slate-300">YouTube preview</p>
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="group relative block w-full overflow-hidden rounded-lg border border-white/10">
          <img src={thumb} alt="YouTube thumbnail" className="h-36 w-full object-cover opacity-90 transition group-hover:opacity-100" loading="lazy" />
          <span className="absolute inset-0 grid place-items-center text-xs text-white/90">Click to embed</span>
        </button>
      ) : (
        <div className="overflow-hidden rounded-lg border border-white/10">
          <div className="aspect-video">
            <iframe
              src={embed}
              title="YouTube preview"
              className="h-full w-full"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  )
}
