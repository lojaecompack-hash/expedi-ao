import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// GET - Listar todos os setores (usuários ativos)
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 })
    }

    // Buscar usuário logado para identificar seu setor
    const dbUser = await prisma.user.findUnique({
      where: { email: authUser.email! }
    })

    if (!dbUser) {
      return NextResponse.json({ ok: false, error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Buscar todos os usuários ativos (cada usuário é um setor)
    const usuarios = await prisma.user.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Mapear para setores
    const setores = usuarios.map(u => ({
      id: u.id,
      nome: u.name
    }))

    return NextResponse.json({
      ok: true,
      setores,
      setorAtual: dbUser.name // Nome do setor do usuário logado
    })

  } catch (error) {
    console.error('[API /api/setores] Erro:', error)
    return NextResponse.json({
      ok: false,
      error: 'Erro ao buscar setores'
    }, { status: 500 })
  }
}
