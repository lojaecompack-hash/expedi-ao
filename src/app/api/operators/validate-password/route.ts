import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { operatorId, password } = body

    if (!operatorId || !password) {
      return NextResponse.json({ ok: false, error: 'Responsável e senha são obrigatórios' }, { status: 400 })
    }

    // Verificar se é usuário (user_xxx) ou operador (op_xxx)
    const isUser = operatorId.startsWith('user_')
    const isOperator = operatorId.startsWith('op_')
    
    // Extrair o ID real (sem prefixo)
    const realId = isUser ? operatorId.replace('user_', '') : 
                   isOperator ? operatorId.replace('op_', '') : 
                   operatorId

    if (isUser) {
      // Buscar usuário
      const user = await prisma.user.findUnique({
        where: { id: realId },
        select: {
          id: true,
          name: true,
          passwordHash: true,
          isActive: true
        }
      })

      if (!user) {
        return NextResponse.json({ ok: false, error: 'Usuário não encontrado' }, { status: 404 })
      }

      if (!user.isActive) {
        return NextResponse.json({ ok: false, error: 'Usuário inativo' }, { status: 403 })
      }

      // Validar senha
      const isValid = await bcrypt.compare(password, user.passwordHash)

      if (!isValid) {
        return NextResponse.json({ ok: false, error: 'Senha incorreta' }, { status: 401 })
      }

      return NextResponse.json({ 
        ok: true, 
        responsavel: {
          id: operatorId,
          name: user.name,
          type: 'USUARIO'
        }
      })
    } else {
      // Buscar operador (compatibilidade com IDs antigos ou op_xxx)
      const operator = await prisma.operator.findUnique({
        where: { id: realId },
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
        responsavel: {
          id: operatorId,
          name: operator.name,
          type: 'OPERADOR'
        }
      })
    }
  } catch (error) {
    console.error('Erro ao validar senha:', error)
    return NextResponse.json({ ok: false, error: 'Erro ao validar senha' }, { status: 500 })
  }
}
