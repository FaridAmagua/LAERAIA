const LIMIT_CONFIG = {
  submitPrompt: { limit: 10, windowMs: 60 * 60 * 1000 },
  vote: { limit: 120, windowMs: 60 * 60 * 1000 },
  moderation: { limit: 120, windowMs: 60 * 60 * 1000 },
  upload: { limit: 20, windowMs: 60 * 60 * 1000 },
} as const

type RouteKey = keyof typeof LIMIT_CONFIG

type RateLimitBucket = {
  count: number
  resetAt: number
}

const memoryStore = new Map<string, RateLimitBucket>()

function getClientKey(ip: string, routeKey: RouteKey): string {
  return `${routeKey}:${ip}`
}

function getIp(headers: Headers): string {
  const xff = headers.get('x-forwarded-for')
  if (xff) {
    return xff.split(',')[0]?.trim() ?? 'unknown-ip'
  }

  return headers.get('x-real-ip') ?? 'unknown-ip'
}

export function checkRateLimit(headers: Headers, routeKey: RouteKey): { allowed: boolean; retryAfter: number } {
  const now = Date.now()
  const ip = getIp(headers)
  const key = getClientKey(ip, routeKey)
  const config = LIMIT_CONFIG[routeKey]
  const current = memoryStore.get(key)

  if (!current || current.resetAt <= now) {
    memoryStore.set(key, { count: 1, resetAt: now + config.windowMs })
    return { allowed: true, retryAfter: 0 }
  }

  if (current.count >= config.limit) {
    return { allowed: false, retryAfter: Math.ceil((current.resetAt - now) / 1000) }
  }

  current.count += 1
  memoryStore.set(key, current)

  return { allowed: true, retryAfter: 0 }
}
