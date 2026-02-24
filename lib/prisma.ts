import { PrismaClient } from '@prisma/client'

type PrismaGlobal = typeof globalThis & {
  __prisma?: PrismaClient
  __databaseUrlChecked?: boolean
}

const globalForPrisma = globalThis as PrismaGlobal

if (!globalForPrisma.__databaseUrlChecked) {
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL)
  console.info(`[env] DATABASE_URL configured: ${hasDatabaseUrl ? 'yes' : 'no'}`)
  globalForPrisma.__databaseUrlChecked = true
}

export const prisma =
  globalForPrisma.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__prisma = prisma
}
