import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PATCH - Encerrar linha do tempo
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; linhaTempoId: string }> }
) {
  try {
    const { id, linhaTempoId } = await params
    const body = await req.json()
    
    const { status, encerradoPor } = body
    
    if (!status || !['ABERTA', 'ENCERRADA'].includes(status)) {
      return NextResponse.json(
        { ok: false, error: 'Status inválido. Use ABERTA ou ENCERRADA' },
        { status: 400 }
      )
    }
    
    // Verificar se linha do tempo existe e pertence ao pickup
    const linhaTempo = await prisma.linhaTempoOcorrencia.findFirst({
      where: { 
        id: linhaTempoId,
        pickupId: id
      }
    })
    
    if (!linhaTempo) {
      return NextResponse.json(
        { ok: false, error: 'Linha do tempo não encontrada' },
        { status: 404 }
      )
    }
    
    // Atualizar linha do tempo
    const linhaAtualizada = await prisma.linhaTempoOcorrencia.update({
      where: { id: linhaTempoId },
      data: {
        status,
        encerradoEm: status === 'ENCERRADA' ? new Date() : null,
        encerradoPor: status === 'ENCERRADA' ? (encerradoPor || null) : null
      }
    })
    
    console.log('[Linhas do Tempo API] Linha atualizada:', linhaTempoId, '-> Status:', status)
    
    return NextResponse.json({
      ok: true,
      linhaTempo: linhaAtualizada
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[Linhas do Tempo API] Erro ao atualizar:', message)
    
    return NextResponse.json(
      { ok: false, error: 'Erro ao atualizar linha do tempo', details: message },
      { status: 500 }
    )
  }
}
