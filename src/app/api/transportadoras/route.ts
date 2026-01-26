import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Listar todas as transportadoras
export async function GET() {
  try {
    const transportadoras = await prisma.transportadora.findMany({
      where: { isActive: true },
      orderBy: { nome: 'asc' }
    })

    return NextResponse.json({
      ok: true,
      transportadoras
    })
  } catch (error) {
    console.error('[Transportadoras] Erro ao listar:', error)
    return NextResponse.json({ ok: false, error: 'Erro ao listar transportadoras' }, { status: 500 })
  }
}

// POST - Criar nova transportadora
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { nome, nomeDisplay, aliases } = body

    if (!nome) {
      return NextResponse.json({ ok: false, error: 'Nome é obrigatório' }, { status: 400 })
    }

    const transportadora = await prisma.transportadora.create({
      data: {
        nome: nome.toUpperCase().trim(),
        nomeDisplay: nomeDisplay || nome,
        aliases: aliases || []
      }
    })

    return NextResponse.json({
      ok: true,
      transportadora
    })
  } catch (error) {
    console.error('[Transportadoras] Erro ao criar:', error)
    return NextResponse.json({ ok: false, error: 'Erro ao criar transportadora' }, { status: 500 })
  }
}
