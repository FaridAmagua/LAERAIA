import { NextRequest, NextResponse } from 'next/server'
import { listTrendingPrompts } from '@/lib/promptData'
import { badRequest } from '@/lib/http'
import { listPromptsQuerySchema } from '@/lib/validators'

export async function GET(request: NextRequest) {
  const parsed = listPromptsQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams.entries()))

  if (!parsed.success) {
    return badRequest('Invalid query params', parsed.error.flatten())
  }

  const data = await listTrendingPrompts(parsed.data.locale, parsed.data.type)

  return NextResponse.json({ items: data, total: data.length })
}
