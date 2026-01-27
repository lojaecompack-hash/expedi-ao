import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Listar linhas do tempo de uma retirada
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const linhasDoTempo = await prisma.linhaTempoOcorrencia.findMany({
      where: { pickupId: id },
      orderBy: { numero: 'desc' },
      include: {
        ocorrencias: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })
    
    return NextResponse.json({
      ok: true,
      linhasDoTempo
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[Linhas do Tempo API] Erro ao listar:', message)
    
    return NextResponse.json(
      { ok: false, error: 'Erro ao listar linhas do tempo', details: message },
      { status: 500 }
    )
  }
}

// POST - Criar nova linha do tempo (só se não houver linha aberta)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
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
    
    // Verificar se já existe linha aberta
    const linhaAberta = await prisma.linhaTempoOcorrencia.findFirst({
      where: { 
        pickupId: id,
        status: 'ABERTA'
      }
    })
    
    if (linhaAberta) {
      return NextResponse.json(
        { ok: false, error: 'Já existe uma linha do tempo aberta. Encerre-a antes de criar uma nova.' },
        { status: 400 }
      )
    }
    
    // Contar linhas existentes para definir o número
    const totalLinhas = await prisma.linhaTempoOcorrencia.count({
      where: { pickupId: id }
    })
    
    // Criar nova linha do tempo
    const novaLinha = await prisma.linhaTempoOcorrencia.create({
      data: {
        pickupId: id,
        numero: totalLinhas + 1,
        status: 'ABERTA'
      }
    })
    
    console.log('[Linhas do Tempo API] Nova linha criada:', novaLinha.id, '- Número:', novaLinha.numero)
    
    return NextResponse.json({
      ok: true,
      linhaTempo: novaLinha
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[Linhas do Tempo API] Erro ao criar:', message)
    
    return NextResponse.json(
      { ok: false, error: 'Erro ao criar linha do tempo', details: message },
      { status: 500 }
    )
  }
}
