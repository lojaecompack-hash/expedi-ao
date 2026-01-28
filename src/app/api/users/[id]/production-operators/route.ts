import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: userId } = await params

    // Buscar operadores de produção do usuário
    const operators = await prisma.productionOperator.findMany({
      where: { userId },
      orderBy: [
        { type: 'asc' },
        { name: 'asc' }
      ],
      select: {
        id: true,
        name: true,
        type: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true
      }
    })

    return NextResponse.json({ ok: true, operators })
  } catch (error) {
    console.error('Erro ao buscar operadores de produção:', error)
    return NextResponse.json({ ok: false, error: 'Erro ao buscar operadores' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: userId } = await params
    const body = await request.json()
    const { name, type, email, phone, password } = body

    if (!name) {
      return NextResponse.json({ ok: false, error: 'Nome é obrigatório' }, { status: 400 })
    }

    if (!type || !['CORTE_SOLDA', 'EXTRUSORA'].includes(type)) {
      return NextResponse.json({ ok: false, error: 'Tipo é obrigatório (CORTE_SOLDA ou EXTRUSORA)' }, { status: 400 })
    }

    if (!password || password.length < 4) {
      return NextResponse.json({ ok: false, error: 'Senha é obrigatória (mínimo 4 caracteres)' }, { status: 400 })
    }

    // Verificar se o usuário existe e é PRODUCAO
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!targetUser) {
      return NextResponse.json({ ok: false, error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Aceitar tanto PRODUCAO (legado) quanto CORTE_SOLDA (novo)
    const userRole = targetUser.role as string
    if (userRole !== 'CORTE_SOLDA' && userRole !== 'PRODUCAO') {
      return NextResponse.json({ ok: false, error: 'Operadores de produção só podem ser vinculados a usuários de Corte e Solda' }, { status: 400 })
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 10)

    // Criar operador de produção
    const operator = await prisma.productionOperator.create({
      data: {
        name,
        type,
        email: email || null,
        phone: phone || null,
        userId: userId,
        passwordHash,
        isActive: true
      }
    })

    return NextResponse.json({ ok: true, operator })
  } catch (error) {
    console.error('Erro ao criar operador de produção:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json({ ok: false, error: `Erro ao criar operador: ${errorMessage}` }, { status: 500 })
  }
}
