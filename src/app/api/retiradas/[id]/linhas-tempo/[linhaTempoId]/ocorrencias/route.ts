import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST - Adicionar ocorrência a uma linha do tempo
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; linhaTempoId: string }> }
) {
  try {
    const { id, linhaTempoId } = await params
    const body = await req.json()
    
    const { descricao, operadorNome, setorOrigem, setorDestino, tipoOcorrencia, motivoRetorno } = body
    
    if (!descricao || descricao.trim() === '') {
      return NextResponse.json(
        { ok: false, error: 'Descrição é obrigatória' },
        { status: 400 }
      )
    }
    
    // Validar tipo de ocorrência
    const tiposValidos = ['INFORMACAO', 'RETORNO_PRODUTO']
    const tipoFinal = tiposValidos.includes(tipoOcorrencia) ? tipoOcorrencia : 'INFORMACAO'
    
    // Validar motivo de retorno (obrigatório se tipo = RETORNO_PRODUTO)
    const motivosValidos = ['DESTINATARIO_AUSENTE', 'ENDERECO_INCORRETO', 'RECUSA_CLIENTE', 'AVARIADO', 'EXTRAVIO', 'OUTRO']
    const motivoFinal = tipoFinal === 'RETORNO_PRODUTO' && motivosValidos.includes(motivoRetorno) ? motivoRetorno : null
    
    // Verificar se linha do tempo existe, pertence ao pickup e está aberta
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
    
    if (linhaTempo.status !== 'ABERTA') {
      return NextResponse.json(
        { ok: false, error: 'Esta linha do tempo já foi encerrada. Crie uma nova linha do tempo.' },
        { status: 400 }
      )
    }
    
    // Marcar TODAS as ocorrências anteriores desta linha do tempo como RESPONDIDA
    await prisma.ocorrencia.updateMany({
      where: {
        linhaTempoId,
        statusOcorrencia: 'PENDENTE'
      },
      data: {
        statusOcorrencia: 'RESPONDIDA'
      }
    })
    
    // Criar nova ocorrência com setor origem e destino
    const ocorrencia = await prisma.ocorrencia.create({
      data: {
        linhaTempoId,
        descricao: descricao.trim(),
        operadorNome: operadorNome || null,
        setorOrigem: setorOrigem || null,
        setorDestino: setorDestino || null,
        statusOcorrencia: 'PENDENTE',
        tipoOcorrencia: tipoFinal,
        motivoRetorno: motivoFinal
      }
    })
    
    console.log('[Ocorrencias API] Ocorrência criada:', ocorrencia.id, 'na linha:', linhaTempoId, 'tipo:', tipoFinal)
    
    // Se for RETORNO_PRODUTO, atualizar status do pickup para RETORNADO
    if (tipoFinal === 'RETORNO_PRODUTO') {
      await prisma.pickup.update({
        where: { id },
        data: { status: 'RETORNADO' }
      })
      console.log('[Ocorrencias API] Pickup', id, 'marcado como RETORNADO')
    }
    
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
