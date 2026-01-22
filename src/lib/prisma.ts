import { PrismaClient } from '@prisma/client'
import { ENV } from './env'

declare global {
  var prisma: PrismaClient | undefined
}

// Usar variável de ambiente do sistema (PRODUÇÃO)
// O banco DEV não está respondendo após restart
const databaseUrl = process.env.DATABASE_URL || ''

// Adicionar pgbouncer=true para desabilitar prepared statements
// Isso resolve o erro 42P05 "prepared statement already exists" no Supabase pooler
const databaseUrlWithPgBouncer = databaseUrl.includes('?') 
  ? `${databaseUrl}&pgbouncer=true`
  : `${databaseUrl}?pgbouncer=true`

console.log(`[Prisma] Ambiente: ${ENV.toUpperCase()}`)
console.log(`[Prisma] Banco: ${databaseUrl?.substring(0, 60)}...`)
console.log(`[Prisma] PgBouncer mode: ENABLED`)

export const prisma = global.prisma ?? new PrismaClient({
  log: ['error'],
  datasources: {
    db: {
      url: databaseUrlWithPgBouncer
    }
  }
})

if (process.env.NODE_ENV !== 'production') global.prisma = prisma
