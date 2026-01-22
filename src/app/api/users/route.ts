import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// Helper para retry com backoff exponencial
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | unknown
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i)
        console.log(`[Retry] Tentativa ${i + 1} falhou, aguardando ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw lastError
}

export async function GET() {
  try {
    console.log('[API /api/users] Iniciando requisição')
    
    const supabase = await createSupabaseServerClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      console.log('[API /api/users] Usuário não autenticado')
      return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 })
    }

    console.log('[API /api/users] Usuário autenticado:', authUser.email)

    // Verificar se é ADMIN com retry
    const dbUser = await retryWithBackoff(async () => {
      return await prisma.user.findUnique({
        where: { email: authUser.email! }
      })
    })

    console.log('[API /api/users] Usuário no DB:', dbUser?.email, 'Role:', dbUser?.role)

    if (!dbUser || dbUser.role !== 'ADMIN') {
      console.log('[API /api/users] Usuário sem permissão')
      return NextResponse.json({ ok: false, error: 'Sem permissão' }, { status: 403 })
    }

    // Buscar todos os usuários com retry
    console.log('[API /api/users] Buscando todos os usuários...')
    const users = await retryWithBackoff(async () => {
      return await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    })

    console.log('[API /api/users] Encontrados', users.length, 'usuários')
    return NextResponse.json({ ok: true, users })
  } catch (error) {
    console.error('[API /api/users] ERRO após todas as tentativas:', error)
    return NextResponse.json({ 
      ok: false, 
      error: 'Erro ao buscar usuários. Tente novamente.',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// Aumentar timeout para 60 segundos
export const maxDuration = 60
