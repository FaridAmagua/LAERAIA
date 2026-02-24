import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createVoterHash } from '@/lib/security'
import { badRequest, notFound, tooManyRequests } from '@/lib/http'
import { checkRateLimit } from '@/lib/rateLimit'

export async function POST(request: NextRequest, context: { params: Promise<{ promptKey: string }> }) {
  const limit = checkRateLimit(request.headers, 'vote')
  if (!limit.allowed) {
    return tooManyRequests(limit.retryAfter)
  }

  const { promptKey } = await context.params
  if (!promptKey) {
    return badRequest('Invalid prompt id')
  }

  const voterHash = createVoterHash(request)

  const prompt = await prisma.prompt.findUnique({ where: { id: promptKey }, select: { id: true, status: true } })
  if (!prompt || prompt.status !== 'approved') {
    return notFound('Prompt not found')
  }

  const existing = await prisma.vote.findUnique({
    where: { promptId_voterHash: { promptId: prompt.id, voterHash } },
    select: { id: true },
  })

  let voted: boolean

  if (existing) {
    await prisma.vote.delete({ where: { promptId_voterHash: { promptId: prompt.id, voterHash } } })
    voted = false
  } else {
    await prisma.vote.create({ data: { promptId: prompt.id, voterHash } })
    voted = true
  }

  const votes = await prisma.vote.count({ where: { promptId: prompt.id } })
  return NextResponse.json({ promptId: prompt.id, voted, votes })
}
