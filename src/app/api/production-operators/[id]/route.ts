import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
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

    const { id } = await params

    // Deletar operador de produção
    await prisma.productionOperator.delete({
      where: { id }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erro ao deletar operador de produção:', error)
    return NextResponse.json({ ok: false, error: 'Erro ao deletar operador' }, { status: 500 })
  }
}
