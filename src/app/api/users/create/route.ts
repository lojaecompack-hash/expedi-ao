import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { prisma } from '@/lib/prisma'
// ModulePermission removido - usando any temporariamente
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    console.log('[API /api/users/create] Iniciando criação de usuário')
    
    const supabase = await createSupabaseServerClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      console.log('[API /api/users/create] Usuário não autenticado')
      return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 })
    }

    console.log('[API /api/users/create] Usuário autenticado:', authUser.email)

    // Verificar se é ADMIN
    const dbUser = await prisma.user.findUnique({
      where: { email: authUser.email! }
    })

    if (!dbUser || dbUser.role !== 'ADMIN') {
      console.log('[API /api/users/create] Usuário sem permissão')
      return NextResponse.json({ ok: false, error: 'Sem permissão' }, { status: 403 })
    }

    const body = await request.json()
    const { email, name, password, role, isManager } = body
    
    console.log('[API /api/users/create] Dados recebidos:', { email, name, role, isManager })

    if (!email || !name || !password || !role) {
      console.log('[API /api/users/create] Dados incompletos:', { email: !!email, name: !!name, password: !!password, role: !!role })
      return NextResponse.json({ ok: false, error: 'Dados incompletos' }, { status: 400 })
    }

    if (!['ADMIN', 'EXPEDICAO', 'CORTE_SOLDA', 'EXTRUSORA', 'ESTOQUE', 'VENDAS', 'FINANCEIRO'].includes(role)) {
      return NextResponse.json({ ok: false, error: 'Role inválido' }, { status: 400 })
    }

    // Verificar se email já existe
    console.log('[API /api/users/create] Verificando se email já existe:', email)
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      console.log('[API /api/users/create] Email já cadastrado:', email)
      return NextResponse.json({ ok: false, error: 'Email já cadastrado' }, { status: 400 })
    }

    // Criar usuário no Supabase Auth usando admin client
    console.log('[API /api/users/create] Criando usuário no Supabase Auth...')
    const supabaseAdmin = createSupabaseAdminClient()
    const { data: newAuthUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (authError || !newAuthUser.user) {
      console.error('[API /api/users/create] Erro ao criar usuário no Supabase:', authError)
      return NextResponse.json({ 
        ok: false, 
        error: 'Erro ao criar usuário no sistema de autenticação',
        details: authError?.message || 'Usuário não criado'
      }, { status: 500 })
    }
    
    console.log('[API /api/users/create] Usuário criado no Supabase Auth:', newAuthUser.user.id)

    // Hash da senha para o banco
    console.log('[API /api/users/create] Gerando hash da senha...')
    const passwordHash = await bcrypt.hash(password, 10)

    // Criar usuário no banco com o MESMO ID do Supabase Auth
    console.log('[API /api/users/create] Criando usuário no banco com ID:', newAuthUser.user.id)
    const newUser = await prisma.user.create({
      data: {
        id: newAuthUser.user.id, // Usar o mesmo ID do Supabase Auth
        email,
        name,
        role,
        passwordHash,
        isActive: true,
        isManager: isManager === true
      }
    })
    
    console.log('[API /api/users/create] Usuário criado no banco:', newUser.id)

    // Buscar workspace Default
    const workspace = await prisma.workspace.findUnique({
      where: { name: 'Default' }
    })

    if (workspace) {
      // Criar membership com permissões baseadas no role
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let permissions: any[] = []
      
      if (role === 'ADMIN') {
        permissions = ['ADMIN', 'SETTINGS', 'EXPEDICAO', 'CORTE_SOLDA']
      } else if (role === 'EXPEDICAO') {
        permissions = ['EXPEDICAO']
      } else if (role === 'CORTE_SOLDA') {
        permissions = ['CORTE_SOLDA']
      } else if (role === 'EXTRUSORA') {
        permissions = ['EXTRUSORA']
      } else if (role === 'ESTOQUE') {
        permissions = ['ESTOQUE']
      } else if (role === 'VENDAS') {
        permissions = ['VENDAS']
      } else if (role === 'FINANCEIRO') {
        permissions = ['FINANCEIRO']
      }

      console.log('[API /api/users/create] Criando membership com permissões:', permissions)
      await prisma.membership.create({
        data: {
          workspaceId: workspace.id,
          userId: newAuthUser.user.id,
          email: email,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          permissions: permissions as any
        }
      })
      console.log('[API /api/users/create] Membership criado com sucesso')
    }

    console.log('[API /api/users/create] Usuário criado com sucesso!')
    return NextResponse.json({ 
      ok: true, 
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      }
    })
  } catch (error) {
    console.error('[API /api/users/create] ERRO:', error)
    return NextResponse.json({ 
      ok: false, 
      error: 'Erro ao criar usuário',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// Aumentar timeout para 60 segundos
export const maxDuration = 60
