import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface Responsavel {
  id: string
  name: string
  type: 'USUARIO' | 'OPERADOR'
  role?: string
  isManager?: boolean
}

// GET - Listar todos os responsáveis (usuários EXPEDICAO + operadores ativos)
export async function GET() {
  try {
    const responsaveis: Responsavel[] = []

    // 1. Buscar usuários do tipo EXPEDICAO que estão ativos E NÃO possuem operadores vinculados
    const usuarios = await prisma.user.findMany({
      where: {
        role: 'EXPEDICAO',
        isActive: true,
        operators: { none: {} } // Excluir usuários que têm operadores
      },
      select: {
        id: true,
        name: true,
        role: true,
        isManager: true
      },
      orderBy: [
        { isManager: 'desc' }, // Gerentes primeiro
        { name: 'asc' }
      ]
    })

    // Adicionar usuários à lista
    for (const user of usuarios) {
      responsaveis.push({
        id: `user_${user.id}`,
        name: user.isManager ? `${user.name} ⭐` : user.name,
        type: 'USUARIO',
        role: user.role,
        isManager: user.isManager
      })
    }

    // 2. Buscar todos os operadores ativos
    const operadores = await prisma.operator.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true
      },
      orderBy: { name: 'asc' }
    })

    // Adicionar operadores à lista
    for (const op of operadores) {
      responsaveis.push({
        id: `op_${op.id}`,
        name: op.name,
        type: 'OPERADOR'
      })
    }

    return NextResponse.json({
      ok: true,
      responsaveis,
      // Contagens para debug/info
      counts: {
        usuarios: usuarios.length,
        operadores: operadores.length,
        total: responsaveis.length
      }
    }, { status: 200 })
  } catch (error) {
    console.error('[Responsaveis API] Erro ao listar:', error)
    return NextResponse.json(
      { ok: false, error: 'Erro ao listar responsáveis' },
      { status: 500 }
    )
  }
}
