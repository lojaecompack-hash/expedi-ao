import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// DELETE - Excluir múltiplas retiradas (apenas ADMIN)
export async function DELETE(req: Request) {
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
      return NextResponse.json({ ok: false, error: 'Sem permissão. Apenas administradores podem excluir retiradas.' }, { status: 403 })
    }

    const body = await req.json()
    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'IDs inválidos. Envie um array de IDs.' },
        { status: 400 }
      )
    }

    console.log('[Retirada BULK DELETE API] Admin', dbUser.email, 'excluindo', ids.length, 'retiradas')
    
    // Deletar múltiplas retiradas (cascade deleta linhas do tempo e ocorrências)
    const result = await prisma.pickup.deleteMany({
      where: {
        id: {
          in: ids
        }
      }
    })
    
    console.log('[Retirada BULK DELETE API] Excluídas', result.count, 'retiradas')
    
    return NextResponse.json({
      ok: true,
      message: `${result.count} retirada(s) excluída(s) com sucesso`,
      count: result.count
    }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[Retirada BULK DELETE API] Erro:', message)
    
    return NextResponse.json(
      { ok: false, error: 'Erro ao excluir retiradas', details: message },
      { status: 500 }
    )
  }
}
