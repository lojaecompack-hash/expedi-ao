import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

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

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        isManager: true,
        createdAt: true
      }
    })

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Usuário não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, user })
  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    return NextResponse.json({ ok: false, error: 'Erro ao buscar usuário' }, { status: 500 })
  }
}

// PATCH - Atualizar usuário
export async function PATCH(
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
    const { name, role } = body

    // Atualizar usuário
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(role && { role })
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        isManager: true
      }
    })

    console.log('[Users API] Usuário atualizado:', userId)

    return NextResponse.json({ ok: true, user: updatedUser })
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error)
    return NextResponse.json({ ok: false, error: 'Erro ao atualizar usuário' }, { status: 500 })
  }
}
