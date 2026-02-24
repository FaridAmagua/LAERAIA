import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/admin'
import { unauthorized, tooManyRequests } from '@/lib/http'
import { listPendingPrompts } from '@/lib/promptData'
import { checkRateLimit } from '@/lib/rateLimit'

export async function GET(request: NextRequest) {
  const limit = checkRateLimit(request.headers, 'moderation')
  if (!limit.allowed) {
    return tooManyRequests(limit.retryAfter)
  }

  if (!isAdminRequest(request)) {
    return unauthorized()
  }

  const locale = request.nextUrl.searchParams.get('locale')
  const items = await listPendingPrompts(locale === 'es' || locale === 'en' ? locale : undefined)

  return NextResponse.json({ items, total: items.length })
}
