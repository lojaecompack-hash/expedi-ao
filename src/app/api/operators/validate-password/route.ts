import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { operatorId, password } = body

    if (!operatorId || !password) {
      return NextResponse.json({ ok: false, error: 'Operador e senha são obrigatórios' }, { status: 400 })
    }

    // Buscar operador
    const operator = await prisma.operator.findUnique({
      where: { id: operatorId },
      select: {
        id: true,
        name: true,
        passwordHash: true,
        isActive: true
      }
    })

    if (!operator) {
      return NextResponse.json({ ok: false, error: 'Operador não encontrado' }, { status: 404 })
    }

    if (!operator.isActive) {
      return NextResponse.json({ ok: false, error: 'Operador inativo' }, { status: 403 })
    }

    // Validar senha
    const isValid = await bcrypt.compare(password, operator.passwordHash)

    if (!isValid) {
      return NextResponse.json({ ok: false, error: 'Senha incorreta' }, { status: 401 })
    }

    return NextResponse.json({ 
      ok: true, 
      operator: {
        id: operator.id,
        name: operator.name
      }
    })
  } catch (error) {
    console.error('Erro ao validar senha:', error)
    return NextResponse.json({ ok: false, error: 'Erro ao validar senha' }, { status: 500 })
  }
}
