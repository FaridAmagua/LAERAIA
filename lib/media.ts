export function toEmbeddableVideoUrl(url: string): string {
  if (!url) {
    return ''
  }

  try {
    const parsed = new URL(url)

    if (parsed.hostname.includes('youtube.com')) {
      const videoId = parsed.searchParams.get('v')
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url
    }

    if (parsed.hostname === 'youtu.be') {
      const id = parsed.pathname.replace('/', '')
      return id ? `https://www.youtube.com/embed/${id}` : url
    }

    if (parsed.hostname.includes('vimeo.com')) {
      const id = parsed.pathname.replace('/', '')
      return id ? `https://player.vimeo.com/video/${id}` : url
    }

    return url
  } catch {
    return url
  }
}

export function isEmbeddableIframe(url: string): boolean {
  if (!url) {
    return false
  }

  return /youtube\.com|youtu\.be|vimeo\.com/.test(url)
}
