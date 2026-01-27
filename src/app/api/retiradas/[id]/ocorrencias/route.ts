import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Listar ocorrências de uma retirada
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const ocorrencias = await prisma.ocorrencia.findMany({
      where: { pickupId: id },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({
      ok: true,
      ocorrencias
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[Ocorrencias API] Erro ao listar:', message)
    
    return NextResponse.json(
      { ok: false, error: 'Erro ao listar ocorrências', details: message },
      { status: 500 }
    )
  }
}

// POST - Criar nova ocorrência
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    
    const { descricao, operadorId, operadorNome } = body
    
    if (!descricao || descricao.trim() === '') {
      return NextResponse.json(
        { ok: false, error: 'Descrição é obrigatória' },
        { status: 400 }
      )
    }
    
    // Verificar se pickup existe
    const pickup = await prisma.pickup.findUnique({
      where: { id }
    })
    
    if (!pickup) {
      return NextResponse.json(
        { ok: false, error: 'Retirada não encontrada' },
        { status: 404 }
      )
    }
    
    // Criar ocorrência
    const ocorrencia = await prisma.ocorrencia.create({
      data: {
        pickupId: id,
        descricao: descricao.trim(),
        status: 'ABERTO',
        operadorId: operadorId || null,
        operadorNome: operadorNome || null
      }
    })
    
    console.log('[Ocorrencias API] Ocorrência criada:', ocorrencia.id)
    
    return NextResponse.json({
      ok: true,
      ocorrencia
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[Ocorrencias API] Erro ao criar:', message)
    
    return NextResponse.json(
      { ok: false, error: 'Erro ao criar ocorrência', details: message },
      { status: 500 }
    )
  }
}
