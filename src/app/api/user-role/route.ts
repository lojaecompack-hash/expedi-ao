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
        console.log(`[User Role API] Tentativa ${i + 1} falhou, aguardando ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw lastError
}

export async function GET() {
  try {
    console.log('[User Role API] Iniciando requisição')
    
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    console.log('[User Role API] Auth user email:', user?.email)

    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    // Buscar role do usuário no banco com retry
    const dbUser = await retryWithBackoff(async () => {
      return await prisma.user.findUnique({
        where: { email: user.email || '' },
        select: { role: true, email: true, name: true, id: true }
      })
    })

    console.log('[User Role API] DB user found:', dbUser)

    if (!dbUser) {
      console.log('[User Role API] Usuário não encontrado no banco para email:', user.email)
      return NextResponse.json(
        { ok: false, error: 'Usuário não encontrado no banco' },
        { status: 404 }
      )
    }

    console.log('[User Role API] Retornando role:', dbUser.role)

    return NextResponse.json({
      ok: true,
      role: dbUser.role,
      email: dbUser.email,
      name: dbUser.name
    }, { status: 200 })
  } catch (error) {
    console.error('[User Role API] Erro após todas as tentativas:', error)
    return NextResponse.json(
      { ok: false, error: 'Erro ao buscar role do usuário', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// Aumentar timeout para 60 segundos
export const maxDuration = 60
