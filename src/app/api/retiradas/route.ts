import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    console.log('[Retiradas API] Buscando retiradas, limit:', limit, 'offset:', offset)
    
    // Buscar retiradas com dados do pedido e ocorrências
    const retiradas = await prisma.pickup.findMany({
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
        ocorrencias: {
          select: {
            id: true,
            status: true
          }
        }
      }
    })
    
    // Adicionar contagem de ocorrências abertas
    const retiradasComOcorrencias = retiradas.map(r => ({
      ...r,
      ocorrenciasAbertas: r.ocorrencias.filter(o => o.status === 'ABERTO').length,
      totalOcorrencias: r.ocorrencias.length
    }))
    
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
