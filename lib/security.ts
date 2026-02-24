import { createHash } from 'node:crypto'
import type { NextRequest } from 'next/server'

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() ?? 'unknown-ip'
  }

  return request.headers.get('x-real-ip') ?? 'unknown-ip'
}

export function createVoterHash(request: NextRequest): string {
  const ip = getClientIp(request)
  const userAgent = request.headers.get('user-agent') ?? 'unknown-ua'
  const raw = `${ip}|${userAgent}`

  return createHash('sha256').update(raw).digest('hex')
}
