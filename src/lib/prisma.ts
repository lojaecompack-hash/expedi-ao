import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

// Detectar ambiente baseado no domínio
const isDev = process.env.VERCEL_URL?.includes('dev.ecomlogic.com.br') || 
              process.env.NEXT_PUBLIC_VERCEL_URL?.includes('dev.ecomlogic.com.br')

// Usar banco de desenvolvimento se for dev.ecomlogic.com.br
const databaseUrl = isDev 
  ? process.env.DATABASE_URL_DEV || process.env.DATABASE_URL
  : process.env.DATABASE_URL

console.log('[Prisma] Ambiente:', isDev ? 'DESENVOLVIMENTO' : 'PRODUÇÃO')
console.log('[Prisma] URL do banco:', databaseUrl?.substring(0, 50) + '...')

export const prisma = global.prisma ?? new PrismaClient({
  log: ['error'],
  datasources: {
    db: {
      url: databaseUrl
    }
  }
})

if (process.env.NODE_ENV !== 'production') global.prisma = prisma
