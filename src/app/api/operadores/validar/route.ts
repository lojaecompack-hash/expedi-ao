import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// POST - Validar senha do operador
export async function POST(request: NextRequest) {
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

    const { operadorId, senha } = await request.json()

    if (!operadorId || !senha) {
      return NextResponse.json({ ok: false, error: 'Operador e senha são obrigatórios' }, { status: 400 })
    }

    // Buscar operador - deve pertencer ao usuário logado
    const operador = await prisma.operator.findFirst({
      where: {
        id: operadorId,
        userId: dbUser.id,
        isActive: true
      }
    })

    if (!operador) {
      return NextResponse.json({ ok: false, error: 'Operador não encontrado' }, { status: 404 })
    }

    // Verificar se operador tem senha cadastrada
    if (!operador.passwordHash) {
      return NextResponse.json({ ok: false, error: 'Operador sem senha cadastrada' }, { status: 400 })
    }

    // Validar senha
    const senhaValida = await bcrypt.compare(senha, operador.passwordHash)

    if (!senhaValida) {
      return NextResponse.json({ ok: false, error: 'Senha incorreta' }, { status: 401 })
    }

    return NextResponse.json({
      ok: true,
      operador: {
        id: operador.id,
        name: operador.name
      }
    })

  } catch (error) {
    console.error('[API /api/operadores/validar] Erro:', error)
    return NextResponse.json({
      ok: false,
      error: 'Erro ao validar operador'
    }, { status: 500 })
  }
}
