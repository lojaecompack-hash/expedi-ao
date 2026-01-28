import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// GET - Buscar usuários por tipo (role) - NÃO REQUER ADMIN
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const tipo = searchParams.get('tipo')

    if (!tipo) {
      return NextResponse.json({ ok: false, error: 'Tipo não fornecido' }, { status: 400 })
    }

    console.log('[API /api/users/by-type] Buscando usuários do tipo:', tipo)

    const supabase = await createSupabaseServerClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      console.log('[API /api/users/by-type] Usuário não autenticado')
      return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 })
    }

    console.log('[API /api/users/by-type] Usuário autenticado:', authUser.email)

    // Buscar usuários do tipo especificado que estão ativos
    const usuarios = await prisma.user.findMany({
      where: {
        role: tipo as 'VENDAS' | 'FINANCEIRO' | 'EXPEDICAO',
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    console.log('[API /api/users/by-type] Encontrados', usuarios.length, 'usuários do tipo', tipo)

    return NextResponse.json({ ok: true, users: usuarios })
  } catch (error) {
    console.error('[API /api/users/by-type] Erro:', error)
    return NextResponse.json({ 
      ok: false, 
      error: 'Erro ao buscar usuários'
    }, { status: 500 })
  }
}
