import { createHash } from 'node:crypto'
import type { NextRequest } from 'next/server'

function adminSessionHash(secret: string): string {
  return createHash('sha256').update(secret).digest('hex')
}

function getAdminSecret(): string | null {
  const token = process.env.ADMIN_TOKEN
  if (token) {
    return token
  }

  const username = process.env.ADMIN_USERNAME
  const password = process.env.ADMIN_PASSWORD
  if (username && password) {
    return `${username}:${password}`
  }

  return null
}

export function isAdminRequest(request: NextRequest): boolean {
  const secret = getAdminSecret()
  if (!secret) {
    return false
  }

  const token = process.env.ADMIN_TOKEN
  const headerToken = request.headers.get('x-admin-token')
  const queryToken = request.nextUrl.searchParams.get('token')
  const cookieSession = request.cookies.get('admin_session')?.value

  if (token) {
    if (headerToken && headerToken === token) {
      return true
    }

    if (queryToken && queryToken === token) {
      return true
    }
  }

  if (cookieSession && cookieSession === adminSessionHash(secret)) {
    return true
  }

  return false
}

export function getAdminSessionValue(): string | null {
  const secret = getAdminSecret()
  if (!secret) {
    return null
  }

  return adminSessionHash(secret)
}
