function daysSince(isoDate: string): number {
  const createdMs = Date.parse(isoDate)

  if (Number.isNaN(createdMs)) {
    return 365
  }

  const ms = Date.now() - createdMs
  return Math.max(0, ms / (1000 * 60 * 60 * 24))
}

export function recencyBoost(createdAt: string): number {
  const age = daysSince(createdAt)
  return Math.max(0, 10 - age / 7)
}

export function trendingScore(votes: number, createdAt: string): number {
  return votes * 2 + recencyBoost(createdAt)
}
