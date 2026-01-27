import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PATCH - Atualizar status da ocorrência
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; ocorrenciaId: string }> }
) {
  try {
    const { id, ocorrenciaId } = await params
    const body = await req.json()
    
    const { status, resolvidoPor } = body
    
    if (!status || !['ABERTO', 'RESOLVIDO'].includes(status)) {
      return NextResponse.json(
        { ok: false, error: 'Status inválido. Use ABERTO ou RESOLVIDO' },
        { status: 400 }
      )
    }
    
    // Verificar se ocorrência existe e pertence ao pickup
    const ocorrencia = await prisma.ocorrencia.findFirst({
      where: { 
        id: ocorrenciaId,
        pickupId: id
      }
    })
    
    if (!ocorrencia) {
      return NextResponse.json(
        { ok: false, error: 'Ocorrência não encontrada' },
        { status: 404 }
      )
    }
    
    // Atualizar ocorrência
    const ocorrenciaAtualizada = await prisma.ocorrencia.update({
      where: { id: ocorrenciaId },
      data: {
        status,
        resolvidoEm: status === 'RESOLVIDO' ? new Date() : null,
        resolvidoPor: status === 'RESOLVIDO' ? (resolvidoPor || null) : null
      }
    })
    
    console.log('[Ocorrencias API] Ocorrência atualizada:', ocorrenciaId, '-> Status:', status)
    
    return NextResponse.json({
      ok: true,
      ocorrencia: ocorrenciaAtualizada
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[Ocorrencias API] Erro ao atualizar:', message)
    
    return NextResponse.json(
      { ok: false, error: 'Erro ao atualizar ocorrência', details: message },
      { status: 500 }
    )
  }
}
