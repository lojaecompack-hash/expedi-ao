import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    console.log('[API /api/users/delete] Iniciando exclusão de usuário')
    
    const supabase = await createSupabaseServerClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      console.log('[API /api/users/delete] Usuário não autenticado')
      return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: authUser.email! }
    })

    if (!dbUser || dbUser.role !== 'ADMIN') {
      console.log('[API /api/users/delete] Usuário sem permissão')
      return NextResponse.json({ ok: false, error: 'Sem permissão' }, { status: 403 })
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ ok: false, error: 'ID do usuário não fornecido' }, { status: 400 })
    }

    console.log('[API /api/users/delete] Excluindo usuário ID:', userId)

    // Não permitir excluir a si mesmo
    if (userId === dbUser.id) {
      return NextResponse.json({ ok: false, error: 'Você não pode excluir sua própria conta' }, { status: 400 })
    }

    // Buscar usuário a ser excluído
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!userToDelete) {
      return NextResponse.json({ ok: false, error: 'Usuário não encontrado' }, { status: 404 })
    }

    console.log('[API /api/users/delete] Usuário encontrado:', userToDelete.email)

    // Excluir memberships
    console.log('[API /api/users/delete] Excluindo memberships...')
    await prisma.membership.deleteMany({
      where: { userId: userId }
    })

    // Excluir do banco de dados
    console.log('[API /api/users/delete] Excluindo do banco de dados...')
    await prisma.user.delete({
      where: { id: userId }
    })

    // Excluir do Supabase Auth
    try {
      console.log('[API /api/users/delete] Excluindo do Supabase Auth...')
      const supabaseAdmin = createSupabaseAdminClient()
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
      
      if (authError) {
        console.error('[API /api/users/delete] Erro ao excluir do Supabase Auth:', authError)
        // Não falhar se não conseguir excluir do Auth
      } else {
        console.log('[API /api/users/delete] Excluído do Supabase Auth com sucesso')
      }
    } catch (authError) {
      console.error('[API /api/users/delete] Erro ao excluir do Supabase Auth:', authError)
      // Não falhar se não conseguir excluir do Auth
    }

    console.log('[API /api/users/delete] Usuário excluído com sucesso!')
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[API /api/users/delete] ERRO:', error)
    return NextResponse.json({ 
      ok: false, 
      error: 'Erro ao excluir usuário',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export const maxDuration = 60
