import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const { email, name, password, role } = await req.json()

    if (!email || !name || !password || !role) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      )
    }

    if (!['ADMIN', 'EXPEDICAO'].includes(role)) {
      return NextResponse.json(
        { error: 'Role inválido' },
        { status: 400 }
      )
    }

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 409 }
      )
    }

    // Hash da senha
    const passwordHash = await hashPassword(password)

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        role,
        passwordHash
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      ok: true,
      user
    }, { status: 201 })

  } catch (error) {
    console.error('[Register API] Erro:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
