import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Atualizar rastreio de uma retirada
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { trackingCode } = body
    
    console.log('[Retirada PATCH API] Atualizando rastreio:', { id, trackingCode })
    
    // Verificar se retirada existe
    const existingPickup = await prisma.pickup.findUnique({
      where: { id }
    })
    
    if (!existingPickup) {
      return NextResponse.json(
        { ok: false, error: 'Retirada não encontrada' },
        { status: 404 }
      )
    }
    
    // Atualizar apenas o trackingCode
    const updatedPickup = await prisma.pickup.update({
      where: { id },
      data: { trackingCode: trackingCode || null }
    })
    
    console.log('[Retirada PATCH API] Rastreio atualizado:', updatedPickup.id)
    
    return NextResponse.json({
      ok: true,
      message: 'Rastreio atualizado com sucesso',
      pickup: updatedPickup
    }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[Retirada PATCH API] Erro:', message)
    
    return NextResponse.json(
      { ok: false, error: 'Erro ao atualizar rastreio', details: message },
      { status: 500 }
    )
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
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
