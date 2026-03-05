import { NextRequest, NextResponse } from 'next/server'
import { getAdminSessionValue } from '@/lib/admin'
import { badRequest, tooManyRequests, unauthorized } from '@/lib/http'
import { checkRateLimit } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
  const limit = checkRateLimit(request.headers, 'moderation')
  if (!limit.allowed) {
    return tooManyRequests(limit.retryAfter)
  }

  const expectedToken = process.env.ADMIN_TOKEN
  const expectedUser = process.env.ADMIN_USERNAME
  const expectedPassword = process.env.ADMIN_PASSWORD
  const sessionValue = getAdminSessionValue()

  if ((!expectedToken && !(expectedUser && expectedPassword)) || !sessionValue) {
    return unauthorized()
  }

  let raw: unknown

  try {
    raw = await request.json()
  } catch {
    return badRequest('Invalid JSON body')
  }

  const token = typeof raw === 'object' && raw && 'token' in raw ? String((raw as { token: unknown }).token ?? '') : ''
  const username = typeof raw === 'object' && raw && 'username' in raw ? String((raw as { username: unknown }).username ?? '') : ''
  const password = typeof raw === 'object' && raw && 'password' in raw ? String((raw as { password: unknown }).password ?? '') : ''

  const tokenValid = Boolean(expectedToken && token && token === expectedToken)
  const userPassValid = Boolean(expectedUser && expectedPassword && username === expectedUser && password === expectedPassword)

  if (!tokenValid && !userPassValid) {
    return unauthorized()
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set('admin_session', sessionValue, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  })

  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set('admin_session', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })

  return response
}
