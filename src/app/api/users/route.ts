import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

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

    // Verificar se é ADMIN
    const dbUser = await prisma.user.findUnique({
      where: { email: authUser.email! }
    })

    console.log('[API /api/users] Usuário no DB:', dbUser?.email, 'Role:', dbUser?.role)

    if (!dbUser || dbUser.role !== 'ADMIN') {
      console.log('[API /api/users] Usuário sem permissão')
      return NextResponse.json({ ok: false, error: 'Sem permissão' }, { status: 403 })
    }

    // Buscar todos os usuários
    console.log('[API /api/users] Buscando todos os usuários...')
    const users = await prisma.user.findMany({
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

    console.log('[API /api/users] Encontrados', users.length, 'usuários')
    return NextResponse.json({ ok: true, users })
  } catch (error) {
    console.error('[API /api/users] ERRO:', error)
    return NextResponse.json({ 
      ok: false, 
      error: 'Erro ao buscar usuários',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
