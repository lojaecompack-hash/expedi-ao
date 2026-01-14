import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('[Test Prisma] Testando conexão com banco...')
    
    // Testar conexão básica
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('[Test Prisma] Conexão OK:', result)
    
    // Testar se tabela Workspace existe
    const workspaces = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "Workspace"`
    console.log('[Test Prisma] Workspaces:', workspaces)
    
    // Testar se TinySettings existe
    const settings = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "TinySettings"`
    console.log('[Test Prisma] TinySettings:', settings)
    
    return NextResponse.json({
      ok: true,
      connection: 'OK',
      workspaces,
      settings
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const stack = error instanceof Error ? error.stack : undefined
    
    console.error('[Test Prisma] Erro:', message)
    console.error('[Test Prisma] Stack:', stack)
    
    return NextResponse.json({
      ok: false,
      error: message,
      stack,
      databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT SET'
    }, { status: 500 })
  }
}
