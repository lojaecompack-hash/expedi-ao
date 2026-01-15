import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    console.log('[Retirada Detalhes API] Buscando retirada ID:', id)
    
    // Buscar retirada com todos os dados
    const retirada = await prisma.pickup.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            id: true,
            tinyOrderId: true,
            orderNumber: true,
            statusTiny: true,
            statusInterno: true,
            createdAt: true,
            updatedAt: true,
          }
        }
      }
    })
    
    if (!retirada) {
      return NextResponse.json(
        { ok: false, error: 'Retirada não encontrada' },
        { status: 404 }
      )
    }
    
    console.log('[Retirada Detalhes API] Retirada encontrada:', retirada.id)
    
    return NextResponse.json({
      ok: true,
      retirada
    }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[Retirada Detalhes API] Erro:', message)
    
    return NextResponse.json(
      { ok: false, error: 'Erro ao buscar detalhes da retirada', details: message },
      { status: 500 }
    )
  }
}
