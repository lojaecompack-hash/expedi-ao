import { PrismaClient } from '@prisma/client'
import { getDatabaseUrl, ENV } from './env'

declare global {
  var prisma: PrismaClient | undefined
}

const databaseUrl = getDatabaseUrl()

console.log(`[Prisma] Ambiente: ${ENV.toUpperCase()}`)
console.log(`[Prisma] Banco: ${databaseUrl?.substring(0, 50)}...`)

export const prisma = global.prisma ?? new PrismaClient({
  log: ['error'],
  datasources: {
    db: {
      url: databaseUrl
    }
  }
})

if (process.env.NODE_ENV !== 'production') global.prisma = prisma
