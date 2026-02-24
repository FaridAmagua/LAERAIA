import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import { badRequest, notFound, unauthorized } from '@/lib/http'
import { voteParamsSchema } from '@/lib/validators'
import { isPendingUploadUrl, pendingPathFromUrl } from '@/lib/uploads'
import { checkRateLimit } from '@/lib/rateLimit'

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const limit = checkRateLimit(request.headers, 'moderation')
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  if (!isAdminRequest(request)) {
    return unauthorized()
  }

  const parsed = voteParamsSchema.safeParse(await context.params)
  if (!parsed.success) {
    return badRequest('Invalid prompt id', parsed.error.flatten())
  }

  const prompt = await prisma.prompt.findUnique({
    where: { id: parsed.data.id },
    select: {
      id: true,
      status: true,
      previewImageUrl: true,
      previewImageMasterUrl: true,
      previewImageCardUrl: true,
      previewImageDetailUrl: true,
    },
  })

  if (!prompt || prompt.status !== 'pending') {
    return notFound('Pending image not found')
  }

  const variantParam = request.nextUrl.searchParams.get('variant')
  const variant = variantParam === 'master' || variantParam === 'detail' || variantParam === 'card' ? variantParam : 'card'

  const selectedUrl =
    variant === 'master'
      ? prompt.previewImageMasterUrl || prompt.previewImageUrl
      : variant === 'detail'
        ? prompt.previewImageDetailUrl || prompt.previewImageMasterUrl || prompt.previewImageCardUrl || prompt.previewImageUrl
        : prompt.previewImageCardUrl || prompt.previewImageUrl

  if (!selectedUrl || !isPendingUploadUrl(selectedUrl)) {
    return notFound('Pending image not found')
  }

  try {
    if (selectedUrl.startsWith('http://') || selectedUrl.startsWith('https://')) {
      const upstream = await fetch(selectedUrl, { cache: 'no-store' })
      if (!upstream.ok) {
        return notFound('Pending image not found')
      }

      const contentType = upstream.headers.get('content-type') || 'image/webp'
      const data = await upstream.arrayBuffer()
      return new NextResponse(data, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'no-store',
        },
      })
    }

    const { readFile } = await import('node:fs/promises')
    const data = await readFile(pendingPathFromUrl(selectedUrl))
    return new NextResponse(data, {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return notFound('Pending image not found')
  }
}
