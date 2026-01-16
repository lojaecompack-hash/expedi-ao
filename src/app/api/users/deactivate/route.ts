import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
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

    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ ok: false, error: 'userId não fornecido' }, { status: 400 })
    }

    // Verificar se usuário existe e não é ADMIN
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!targetUser) {
      return NextResponse.json({ ok: false, error: 'Usuário não encontrado' }, { status: 404 })
    }

    if (targetUser.role === 'ADMIN') {
      return NextResponse.json({ ok: false, error: 'Não é possível desativar usuários ADMIN' }, { status: 400 })
    }

    // Desativar usuário
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erro ao desativar usuário:', error)
    return NextResponse.json({ ok: false, error: 'Erro ao desativar usuário' }, { status: 500 })
  }
}
