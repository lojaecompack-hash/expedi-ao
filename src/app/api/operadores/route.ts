import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// GET - Listar operadores do usuário logado
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 })
    }

    // Buscar usuário no banco
    const dbUser = await prisma.user.findUnique({
      where: { email: authUser.email! }
    })

    if (!dbUser) {
      return NextResponse.json({ ok: false, error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Buscar operadores vinculados a este usuário
    const operadores = await prisma.operator.findMany({
      where: {
        userId: dbUser.id,
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

    return NextResponse.json({
      ok: true,
      operadores
    })

  } catch (error) {
    console.error('[API /api/operadores] Erro:', error)
    return NextResponse.json({
      ok: false,
      error: 'Erro ao buscar operadores'
    }, { status: 500 })
  }
}
