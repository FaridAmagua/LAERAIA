import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminRequest } from '@/lib/admin'
import { badRequest, notFound, tooManyRequests, unauthorized } from '@/lib/http'
import { checkRateLimit } from '@/lib/rateLimit'
import { voteParamsSchema } from '@/lib/validators'
import { isPendingUploadUrl, removePendingImage } from '@/lib/uploads'

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const limit = checkRateLimit(request.headers, 'moderation')
  if (!limit.allowed) {
    return tooManyRequests(limit.retryAfter)
  }

  if (!isAdminRequest(request)) {
    return unauthorized()
  }

  const parsedParams = voteParamsSchema.safeParse(await context.params)
  if (!parsedParams.success) {
    return badRequest('Invalid prompt id', parsedParams.error.flatten())
  }

  const id = parsedParams.data.id
  const prompt = await prisma.prompt.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      previewImageUrl: true,
      previewImageMasterUrl: true,
      previewImageCardUrl: true,
      previewImageDetailUrl: true,
    },
  })

  if (!prompt) {
    return notFound('Prompt not found')
  }

  if (prompt.status === 'pending') {
    const pendingUrls = [prompt.previewImageUrl, prompt.previewImageMasterUrl, prompt.previewImageCardUrl, prompt.previewImageDetailUrl].filter(
      (url): url is string => Boolean(url && isPendingUploadUrl(url)),
    )

    await Promise.all([...new Set(pendingUrls)].map((url) => removePendingImage(url)))
  }

  await prisma.prompt.update({
    where: { id },
    data: { status: 'rejected' },
  })

  return NextResponse.json({ id, status: 'rejected' })
}
