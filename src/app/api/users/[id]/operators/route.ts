import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 })
    }

    // Verificar se é ADMIN
    const dbUser = await prisma.user.findUnique({
      where: { email: authUser.email! }
    })

    if (!dbUser || dbUser.role !== 'ADMIN') {
      return NextResponse.json({ ok: false, error: 'Sem permissão' }, { status: 403 })
    }

    const userId = params.id

    // Buscar operadores deste usuário
    const operators = await prisma.operator.findMany({
      where: { 
        userId: userId,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ ok: true, operators })
  } catch (error) {
    console.error('Erro ao buscar operadores:', error)
    return NextResponse.json({ ok: false, error: 'Erro ao buscar operadores' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 })
    }

    // Verificar se é ADMIN
    const dbUser = await prisma.user.findUnique({
      where: { email: authUser.email! }
    })

    if (!dbUser || dbUser.role !== 'ADMIN') {
      return NextResponse.json({ ok: false, error: 'Sem permissão' }, { status: 403 })
    }

    const userId = params.id
    const body = await request.json()
    const { name, email, phone } = body

    if (!name) {
      return NextResponse.json({ ok: false, error: 'Nome é obrigatório' }, { status: 400 })
    }

    // Verificar se o usuário existe e é EXPEDIÇÃO
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!targetUser) {
      return NextResponse.json({ ok: false, error: 'Usuário não encontrado' }, { status: 404 })
    }

    if (targetUser.role !== 'EXPEDICAO') {
      return NextResponse.json({ ok: false, error: 'Operadores só podem ser vinculados a usuários EXPEDIÇÃO' }, { status: 400 })
    }

    // Criar operador
    const operator = await prisma.operator.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        userId: userId,
        isActive: true
      }
    })

    return NextResponse.json({ ok: true, operator })
  } catch (error) {
    console.error('Erro ao criar operador:', error)
    return NextResponse.json({ ok: false, error: 'Erro ao criar operador' }, { status: 500 })
  }
}
