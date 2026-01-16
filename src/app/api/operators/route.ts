import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

// GET - Listar operadores do usuário logado
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Se não tiver usuário logado, retorna vazio (segurança)
    if (!user) {
      return NextResponse.json({
        ok: true,
        operators: []
      }, { status: 200 })
    }

    // Buscar operadores do usuário OU operadores sem dono (backward compatibility)
    const operators = await prisma.operator.findMany({
      where: {
        OR: [
          { userId: user.id },
          { userId: null }
        ]
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({
      ok: true,
      operators
    }, { status: 200 })
  } catch (error) {
    console.error('[Operators API] Erro ao listar:', error)
    return NextResponse.json(
      { ok: false, error: 'Erro ao listar operadores' },
      { status: 500 }
    )
  }
}

// POST - Criar novo operador
export async function POST(req: Request) {
  try {
    const { name, email, phone } = await req.json()

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se email já existe
    if (email) {
      const existing = await prisma.operator.findUnique({
        where: { email: email.toLowerCase() }
      })

      if (existing) {
        return NextResponse.json(
          { ok: false, error: 'Email já cadastrado' },
          { status: 409 }
        )
      }
    }

    // Pegar userId do Supabase Auth
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const operator = await prisma.operator.create({
      data: {
        name: name.trim(),
        email: email ? email.toLowerCase() : null,
        phone: phone || null,
        userId: user?.id || null // Vincular ao usuário logado
      }
    })

    return NextResponse.json({
      ok: true,
      operator
    }, { status: 201 })
  } catch (error) {
    console.error('[Operators API] Erro ao criar:', error)
    return NextResponse.json(
      { ok: false, error: 'Erro ao criar operador' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar operador
export async function PUT(req: Request) {
  try {
    const { id, name, email, phone, isActive } = await req.json()

    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'ID é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar ownership
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se operador pertence ao usuário
    const existing = await prisma.operator.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: 'Operador não encontrado' },
        { status: 404 }
      )
    }

    // Permitir edição se for dono OU se operador não tem dono (backward compatibility)
    if (existing.userId && existing.userId !== user.id) {
      return NextResponse.json(
        { ok: false, error: 'Você não tem permissão para editar este operador' },
        { status: 403 }
      )
    }

    const operator = await prisma.operator.update({
      where: { id },
      data: {
        name: name?.trim(),
        email: email ? email.toLowerCase() : null,
        phone: phone || null,
        isActive: isActive !== undefined ? isActive : undefined
      }
    })

    return NextResponse.json({
      ok: true,
      operator
    }, { status: 200 })
  } catch (error) {
    console.error('[Operators API] Erro ao atualizar:', error)
    return NextResponse.json(
      { ok: false, error: 'Erro ao atualizar operador' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir operador
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'ID é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar ownership
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se operador pertence ao usuário
    const existing = await prisma.operator.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: 'Operador não encontrado' },
        { status: 404 }
      )
    }

    // Permitir exclusão se for dono OU se operador não tem dono (backward compatibility)
    if (existing.userId && existing.userId !== user.id) {
      return NextResponse.json(
        { ok: false, error: 'Você não tem permissão para excluir este operador' },
        { status: 403 }
      )
    }

    await prisma.operator.delete({
      where: { id }
    })

    return NextResponse.json({
      ok: true,
      message: 'Operador excluído com sucesso'
    }, { status: 200 })
  } catch (error) {
    console.error('[Operators API] Erro ao excluir:', error)
    return NextResponse.json(
      { ok: false, error: 'Erro ao excluir operador' },
      { status: 500 }
    )
  }
}
