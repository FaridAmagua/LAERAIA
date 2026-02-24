import { PromptStatus } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/admin'
import { badRequest, tooManyRequests, unauthorized } from '@/lib/http'
import { listAdminPrompts } from '@/lib/promptData'
import { checkRateLimit } from '@/lib/rateLimit'

export async function GET(request: NextRequest) {
  const limit = checkRateLimit(request.headers, 'moderation')
  if (!limit.allowed) {
    return tooManyRequests(limit.retryAfter)
  }

  if (!isAdminRequest(request)) {
    return unauthorized()
  }

  const localeRaw = request.nextUrl.searchParams.get('locale')
  const statusRaw = request.nextUrl.searchParams.get('status')
  const limitRaw = Number(request.nextUrl.searchParams.get('limit') || '100')

  const locale = localeRaw === 'es' || localeRaw === 'en' ? localeRaw : undefined
  const status = statusRaw === 'pending' || statusRaw === 'approved' || statusRaw === 'rejected' ? statusRaw : 'pending'
  if (!Number.isFinite(limitRaw) || limitRaw < 1 || limitRaw > 200) {
    return badRequest('Invalid limit')
  }

  const items = await listAdminPrompts(status as PromptStatus, locale, limitRaw)
  return NextResponse.json({ items, total: items.length, status })
}
