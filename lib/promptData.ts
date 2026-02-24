import type { Prisma } from '@prisma/client'
import { PromptStatus } from '@prisma/client'
import { prisma } from './prisma'
import type { Locale, PromptDetail, PromptSummary, PromptType } from './types'
import { trendingScore } from './trending'

const promptSummarySelect = {
  id: true,
  slug: true,
  locale: true,
  type: true,
  title: true,
  description: true,
  promptText: true,
  category: true,
  collection: true,
  style: true,
  mood: true,
  duration: true,
  tags: true,
  tool: true,
  previewImageUrl: true,
  previewImageMasterUrl: true,
  previewImageCardUrl: true,
  previewImageDetailUrl: true,
  previewFocusX: true,
  previewFocusY: true,
  previewScale: true,
  youtubeUrl: true,
  resultUrl: true,
  source: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  settingsJson: true,
  _count: { select: { votes: true } },
} satisfies Prisma.PromptSelect

type PromptWithVotes = Prisma.PromptGetPayload<{ select: typeof promptSummarySelect }>

function toPromptSummary(row: PromptWithVotes): PromptSummary {
  return {
    id: row.id,
    slug: row.slug,
    locale: row.locale,
    type: row.type,
    title: row.title,
    description: row.description ?? '',
    promptText: row.promptText,
    category: row.category,
    collection: row.collection || 'general',
    style: row.style,
    mood: row.mood,
    duration: row.duration,
    tags: row.tags,
    tool: row.tool,
    previewImageUrl: row.previewImageCardUrl || row.previewImageUrl,
    previewImageMasterUrl: row.previewImageMasterUrl || row.previewImageUrl,
    previewImageCardUrl: row.previewImageCardUrl || row.previewImageUrl,
    previewImageDetailUrl: row.previewImageDetailUrl || row.previewImageMasterUrl || row.previewImageUrl,
    previewFocusX: Math.max(0, Math.min(100, row.previewFocusX ?? 50)),
    previewFocusY: Math.max(0, Math.min(100, row.previewFocusY ?? 50)),
    previewScale: Math.max(100, row.previewScale ?? 100),
    youtubeUrl: row.youtubeUrl,
    resultUrl: row.resultUrl,
    source: row.source,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    voteCount: row._count.votes,
  }
}

export type PromptListFilters = {
  locale: Locale
  type?: PromptType
  tag?: string
  collection?: string
  search?: string
  page?: number
  pageSize?: number
  includePending?: boolean
}

export async function listPrompts(filters: PromptListFilters): Promise<{ items: PromptSummary[]; total: number; page: number; pageSize: number }> {
  const page = filters.page ?? 1
  const pageSize = filters.pageSize ?? 12

  const where: Prisma.PromptWhereInput = {
    locale: filters.locale,
    status: filters.includePending ? undefined : PromptStatus.approved,
    type: filters.type,
    collection: filters.collection || undefined,
    tags: filters.tag ? { has: filters.tag } : undefined,
    OR: filters.search
      ? [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
          { promptText: { contains: filters.search, mode: 'insensitive' } },
        ]
      : undefined,
  }

  let rows: PromptWithVotes[] = []
  let total = 0
  try {
    ;[rows, total] = await Promise.all([
      prisma.prompt.findMany({
        where,
        select: promptSummarySelect,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.prompt.count({ where }),
    ])
  } catch (error) {
    console.error('[promptData] listPrompts failed:', error)
  }

  return {
    items: rows.map(toPromptSummary),
    total,
    page,
    pageSize,
  }
}

export async function findPromptBySlug(locale: Locale, slug: string): Promise<PromptDetail | null> {
  const row = await prisma.prompt.findFirst({
    where: {
      slug,
      locale,
      status: PromptStatus.approved,
    },
    select: promptSummarySelect,
  })

  if (!row) {
    return null
  }

  return {
    ...toPromptSummary(row),
    settingsJson: (row.settingsJson as Record<string, unknown> | null) ?? null,
  }
}

export async function listTrendingPrompts(locale: Locale, type?: PromptType): Promise<Array<PromptSummary & { trendingScore: number }>> {
  let rows: PromptWithVotes[] = []
  try {
    rows = await prisma.prompt.findMany({
      where: {
        locale,
        type,
        status: PromptStatus.approved,
      },
      select: promptSummarySelect,
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
  } catch (error) {
    console.error('[promptData] listTrendingPrompts failed:', error)
  }

  return rows
    .map((row) => {
      const summary = toPromptSummary(row)
      return {
        ...summary,
        trendingScore: trendingScore(summary.voteCount, summary.createdAt),
      }
    })
    .sort((a, b) => b.trendingScore - a.trendingScore)
}

export async function listPendingPrompts(locale?: Locale): Promise<PromptSummary[]> {
  const rows = await prisma.prompt.findMany({
    where: {
      status: PromptStatus.pending,
      locale,
      source: 'community',
    },
    select: promptSummarySelect,
    orderBy: { createdAt: 'asc' },
  })

  return rows.map(toPromptSummary)
}

export async function listAdminPrompts(
  status: PromptStatus,
  locale?: Locale,
  limit = 100,
): Promise<PromptSummary[]> {
  const rows = await prisma.prompt.findMany({
    where: {
      status,
      locale,
    },
    select: promptSummarySelect,
    orderBy: { createdAt: 'desc' },
    take: Math.max(1, Math.min(limit, 200)),
  })

  return rows.map(toPromptSummary)
}


