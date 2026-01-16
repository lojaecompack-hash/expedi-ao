import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

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
    const { email, name, password, role } = body

    if (!email || !name || !password || !role) {
      return NextResponse.json({ ok: false, error: 'Dados incompletos' }, { status: 400 })
    }

    if (!['ADMIN', 'EXPEDICAO'].includes(role)) {
      return NextResponse.json({ ok: false, error: 'Role inválido' }, { status: 400 })
    }

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ ok: false, error: 'Email já cadastrado' }, { status: 400 })
    }

    // Criar usuário no Supabase Auth
    const { data: newAuthUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (authError || !newAuthUser.user) {
      console.error('Erro ao criar usuário no Supabase:', authError)
      return NextResponse.json({ ok: false, error: 'Erro ao criar usuário no sistema de autenticação' }, { status: 500 })
    }

    // Hash da senha para o banco
    const passwordHash = await bcrypt.hash(password, 10)

    // Criar usuário no banco
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        role,
        passwordHash,
        isActive: true
      }
    })

    // Buscar workspace Default
    const workspace = await prisma.workspace.findUnique({
      where: { name: 'Default' }
    })

    if (workspace) {
      // Criar membership
      const permissions = role === 'ADMIN' 
        ? ['ADMIN', 'SETTINGS', 'EXPEDICAO'] 
        : ['EXPEDICAO']

      await prisma.membership.create({
        data: {
          workspaceId: workspace.id,
          userId: newAuthUser.user.id,
          email: email,
          permissions: permissions as any
        }
      })
    }

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
    console.error('Erro ao criar usuário:', error)
    return NextResponse.json({ ok: false, error: 'Erro ao criar usuário' }, { status: 500 })
  }
}
