import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminRequest } from '@/lib/admin'
import { badRequest, notFound, tooManyRequests, unauthorized } from '@/lib/http'
import { checkRateLimit } from '@/lib/rateLimit'
import { voteParamsSchema } from '@/lib/validators'
import { isApprovedUploadUrl, isPendingUploadUrl, movePendingToApproved, pendingImageExists } from '@/lib/uploads'

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

  if (prompt.status === 'approved') {
    return NextResponse.json({
      id,
      status: 'approved',
      previewImageUrl: prompt.previewImageCardUrl || prompt.previewImageUrl,
      previewImageMasterUrl: prompt.previewImageMasterUrl || prompt.previewImageUrl,
      previewImageCardUrl: prompt.previewImageCardUrl || prompt.previewImageUrl,
      previewImageDetailUrl: prompt.previewImageDetailUrl || prompt.previewImageUrl,
    })
  }

  if (prompt.status === 'rejected') {
    const approvedUrl = prompt.previewImageCardUrl || prompt.previewImageUrl
    if (!approvedUrl || !isApprovedUploadUrl(approvedUrl)) {
      return badRequest('Rejected prompt has no approved preview to restore')
    }

    await prisma.prompt.update({
      where: { id },
      data: { status: 'approved' },
    })

    return NextResponse.json({
      id,
      status: 'approved',
      previewImageUrl: approvedUrl,
      previewImageMasterUrl: prompt.previewImageMasterUrl || prompt.previewImageUrl,
      previewImageCardUrl: prompt.previewImageCardUrl || prompt.previewImageUrl,
      previewImageDetailUrl: prompt.previewImageDetailUrl || prompt.previewImageUrl,
    })
  }

  const hasVariantSet = Boolean(prompt.previewImageMasterUrl && prompt.previewImageCardUrl && prompt.previewImageDetailUrl)

  if (hasVariantSet) {
    const pendingMasterUrl = prompt.previewImageMasterUrl
    const pendingCardUrl = prompt.previewImageCardUrl
    const pendingDetailUrl = prompt.previewImageDetailUrl

    if (!isPendingUploadUrl(pendingMasterUrl)) {
      return badRequest('Prompt master preview path is invalid for approval')
    }

    if (!isPendingUploadUrl(pendingCardUrl)) {
      return badRequest('Prompt card preview path is invalid for approval')
    }

    if (!isPendingUploadUrl(pendingDetailUrl)) {
      return badRequest('Prompt detail preview path is invalid for approval')
    }

    const [hasMaster, hasCard, hasDetail] = await Promise.all([
      pendingImageExists(pendingMasterUrl),
      pendingImageExists(pendingCardUrl),
      pendingImageExists(pendingDetailUrl),
    ])

    if (!hasMaster || !hasCard || !hasDetail) {
      return badRequest('One or more pending image files were not found')
    }

    const [approvedMasterUrl, approvedCardUrl, approvedDetailUrl] = await Promise.all([
      movePendingToApproved(pendingMasterUrl),
      movePendingToApproved(pendingCardUrl),
      movePendingToApproved(pendingDetailUrl),
    ])

    await prisma.prompt.update({
      where: { id },
      data: {
        status: 'approved',
        previewImageUrl: approvedCardUrl,
        previewImageMasterUrl: approvedMasterUrl,
        previewImageCardUrl: approvedCardUrl,
        previewImageDetailUrl: approvedDetailUrl,
      },
    })

    return NextResponse.json({
      id,
      status: 'approved',
      previewImageUrl: approvedCardUrl,
      previewImageMasterUrl: approvedMasterUrl,
      previewImageCardUrl: approvedCardUrl,
      previewImageDetailUrl: approvedDetailUrl,
    })
  }

  if (!isPendingUploadUrl(prompt.previewImageUrl)) {
    return badRequest('Prompt preview path is invalid for approval')
  }

  if (!(await pendingImageExists(prompt.previewImageUrl))) {
    return badRequest('Pending image file not found')
  }

  const approvedUrl = await movePendingToApproved(prompt.previewImageUrl)

  await prisma.prompt.update({
    where: { id },
    data: {
      status: 'approved',
      previewImageUrl: approvedUrl,
      previewImageMasterUrl: approvedUrl,
      previewImageCardUrl: approvedUrl,
      previewImageDetailUrl: approvedUrl,
    },
  })

  return NextResponse.json({
    id,
    status: 'approved',
    previewImageUrl: approvedUrl,
    previewImageMasterUrl: approvedUrl,
    previewImageCardUrl: approvedUrl,
    previewImageDetailUrl: approvedUrl,
  })
}
