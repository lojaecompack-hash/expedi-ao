import { PrismaClient } from '@prisma/client'
import { ENV } from './env'
import * as fs from 'fs'
import * as path from 'path'

declare global {
  var prisma: PrismaClient | undefined
}

// Ler DATABASE_URL do arquivo .env.local diretamente
// Isso ignora variáveis de ambiente do sistema
function getDatabaseUrlFromFile(): string {
  if (process.env.NODE_ENV === 'development') {
    try {
      const envLocalPath = path.join(process.cwd(), '.env.local')
      const envContent = fs.readFileSync(envLocalPath, 'utf-8')
      const match = envContent.match(/DATABASE_URL\s*=\s*["']?([^"'\n]+)["']?/)
      if (match) {
        console.log('[Prisma] Usando DATABASE_URL do arquivo .env.local')
        return match[1]
      }
    } catch (error) {
      console.error('[Prisma] Erro ao ler .env.local:', error)
    }
  }
  
  // Fallback para variável de ambiente
  return process.env.DATABASE_URL || ''
}

const databaseUrl = getDatabaseUrlFromFile()

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
