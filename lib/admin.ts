import { createHash } from 'node:crypto'
import type { NextRequest } from 'next/server'

function adminSessionHash(expectedToken: string): string {
  return createHash('sha256').update(expectedToken).digest('hex')
}

export function isAdminRequest(request: NextRequest): boolean {
  const expected = process.env.ADMIN_TOKEN
  if (!expected) {
    return false
  }

  const headerToken = request.headers.get('x-admin-token')
  const queryToken = request.nextUrl.searchParams.get('token')
  const cookieSession = request.cookies.get('admin_session')?.value

  if (headerToken && headerToken === expected) {
    return true
  }

  if (queryToken && queryToken === expected) {
    return true
  }

  if (cookieSession && cookieSession === adminSessionHash(expected)) {
    return true
  }

  return false
}

export function getAdminSessionValue(): string | null {
  const expected = process.env.ADMIN_TOKEN
  if (!expected) {
    return null
  }

  return adminSessionHash(expected)
}
