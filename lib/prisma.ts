import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  // Ensure DATABASE_URL is available at runtime
  if (typeof process !== 'undefined' && !process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

// Lazy initialization to avoid build-time evaluation issues
function getPrisma() {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }
  
  const client = createPrismaClient()
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client
  }
  return client
}

// Export a getter that only instantiates Prisma at runtime
// This prevents build-time evaluation which can cause edge runtime resolution issues
let _prisma: PrismaClient | undefined
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (!_prisma) {
      _prisma = getPrisma()
    }
    const value = (_prisma as any)[prop]
    if (typeof value === 'function') {
      return value.bind(_prisma)
    }
    return value
  },
})
