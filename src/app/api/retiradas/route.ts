import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const setorDestino = searchParams.get('setorDestino')
    
    console.log('[Retiradas API] Buscando retiradas, limit:', limit, 'offset:', offset, 'setorDestino:', setorDestino)
    
    // Se tiver filtro de setor, buscar apenas retiradas com ocorrências para esse setor
    let whereClause = {}
    if (setorDestino && setorDestino !== 'TODOS') {
      whereClause = {
        linhasDoTempo: {
          some: {
            status: 'ABERTA',
            ocorrencias: {
              some: {
                setorDestino: setorDestino,
                statusOcorrencia: 'PENDENTE'
              }
            }
          }
        }
      }
    }
    
    // Buscar retiradas com dados do pedido e linhas do tempo
    const retiradas = await prisma.pickup.findMany({
      where: whereClause,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: {
            id: true,
            tinyOrderId: true,
            orderNumber: true,
            statusTiny: true,
            statusInterno: true,
            createdAt: true,
          }
        },
        linhasDoTempo: {
          select: {
            id: true,
            status: true,
            ocorrencias: {
              select: {
                id: true,
                statusOcorrencia: true,
                setorDestino: true
              },
              orderBy: {
                createdAt: 'desc'
              },
              take: 1
            }
          }
        }
      }
    })
    
    // Adicionar status da última ocorrência
    const retiradasComOcorrencias = retiradas.map(r => {
      // Pegar a última ocorrência da linha do tempo aberta
      const linhaAberta = r.linhasDoTempo?.find(l => l.status === 'ABERTA')
      const ultimaOcorrencia = linhaAberta?.ocorrencias?.[0]
      
      // Determinar status para exibição
      let statusOcorrencia = null
      if (linhaAberta && ultimaOcorrencia) {
        statusOcorrencia = ultimaOcorrencia.statusOcorrencia
      }
      
      return {
        ...r,
        ocorrenciasAbertas: r.linhasDoTempo?.filter(l => l.status === 'ABERTA').length || 0,
        totalOcorrencias: r.linhasDoTempo?.length || 0,
        statusUltimaOcorrencia: statusOcorrencia,
        setorDestinoUltimaOcorrencia: ultimaOcorrencia?.setorDestino || null
      }
    })
    
    // Contar total
    const total = await prisma.pickup.count()
    
    console.log('[Retiradas API] Encontradas:', retiradas.length, 'Total:', total)
    
    return NextResponse.json({
      ok: true,
      retiradas: retiradasComOcorrencias,
      total,
      limit,
      offset
    }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[Retiradas API] Erro:', message)
    
    return NextResponse.json(
      { ok: false, error: 'Erro ao buscar retiradas', details: message },
      { status: 500 }
    )
  }
}
