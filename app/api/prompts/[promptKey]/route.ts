import { NextRequest, NextResponse } from 'next/server'
import { findPromptBySlug } from '@/lib/promptData'
import { badRequest, notFound } from '@/lib/http'
import { promptBySlugQuerySchema } from '@/lib/validators'

export async function GET(request: NextRequest, context: { params: Promise<{ promptKey: string }> }) {
  const { promptKey } = await context.params
  const parsedQuery = promptBySlugQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams.entries()))

  if (!parsedQuery.success) {
    return badRequest('Invalid query params', parsedQuery.error.flatten())
  }

  const prompt = await findPromptBySlug(parsedQuery.data.locale, promptKey)

  if (!prompt) {
    return notFound('Prompt not found')
  }

  return NextResponse.json(prompt)
}
