import { PrismaClient } from '@prisma/client'
import { ENV } from './env'

declare global {
  var prisma: PrismaClient | undefined
}

// Usar variável de ambiente do sistema (PRODUÇÃO)
// O banco DEV não está respondendo após restart
const databaseUrl = process.env.DATABASE_URL || ''

console.log(`[Prisma] Ambiente: ${ENV.toUpperCase()}`)
console.log(`[Prisma] Banco: ${databaseUrl?.substring(0, 60)}...`)

export const prisma = global.prisma ?? new PrismaClient({
  log: ['error'],
  datasources: {
    db: {
      url: databaseUrl
    }
  }
})

if (process.env.NODE_ENV !== 'production') global.prisma = prisma
