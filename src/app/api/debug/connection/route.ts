import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getEnvSummary } from '@/lib/env'

export async function GET() {
  const startTime = Date.now()
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: getEnvSummary(),
    databaseUrl: {
      exists: !!process.env.DATABASE_URL,
      preview: process.env.DATABASE_URL?.substring(0, 80) + '...',
      length: process.env.DATABASE_URL?.length || 0
    },
    supabaseUrl: {
      exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      value: process.env.NEXT_PUBLIC_SUPABASE_URL
    },
    supabaseAnonKey: {
      exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      preview: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 50) + '...'
    }
  }

  // Test database connection
  try {
    console.log('[Debug] Testando conexão com banco de dados...')
    
    const userCount = await prisma.user.count()
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true },
      take: 5
    })
    
    results.database = {
      connected: true,
      userCount,
      users,
      responseTime: Date.now() - startTime
    }
    
    console.log('[Debug] Conexão OK! Usuários:', userCount)
  } catch (error) {
    console.error('[Debug] Erro de conexão:', error)
    results.database = {
      connected: false,
      error: error instanceof Error ? error.message : String(error),
      errorName: error instanceof Error ? error.name : 'Unknown',
      responseTime: Date.now() - startTime
    }
  }

  return NextResponse.json(results, { status: 200 })
}
