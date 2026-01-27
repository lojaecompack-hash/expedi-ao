import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTinyOrderDetails } from '@/lib/tiny-api'

export async function POST() {
  try {
    console.log('[Sync Transportadoras] Iniciando sincronização...')
    
    // Buscar pickups sem transportadora
    const pickupsSemTransportadora = await prisma.pickup.findMany({
      where: {
        OR: [
          { transportadora: null },
          { transportadora: '' }
        ]
      },
      include: {
        order: {
          select: {
            orderNumber: true,
            tinyOrderId: true
          }
        }
      },
      take: 50 // Limitar para evitar timeout
    })
    
    console.log('[Sync Transportadoras] Pickups sem transportadora:', pickupsSemTransportadora.length)
    
    if (pickupsSemTransportadora.length === 0) {
      return NextResponse.json({
        ok: true,
        message: 'Nenhum pickup para atualizar',
        atualizados: 0
      })
    }
    
    let atualizados = 0
    const erros: string[] = []
    
    for (const pickup of pickupsSemTransportadora) {
      try {
        // Buscar detalhes do pedido na Tiny
        const detalhes = await getTinyOrderDetails(pickup.order.orderNumber)
        
        if (detalhes && detalhes.transportadora && detalhes.transportadora !== 'Não definida') {
          // Atualizar pickup com transportadora
          await prisma.pickup.update({
            where: { id: pickup.id },
            data: { transportadora: detalhes.transportadora }
          })
          
          console.log(`[Sync] Pickup ${pickup.id} atualizado: ${detalhes.transportadora}`)
          atualizados++
        } else {
          console.log(`[Sync] Pickup ${pickup.id} - transportadora não encontrada na Tiny`)
        }
        
        // Pequeno delay para não sobrecarregar a API Tiny
        await new Promise(resolve => setTimeout(resolve, 200))
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido'
        console.error(`[Sync] Erro no pickup ${pickup.id}:`, msg)
        erros.push(`${pickup.order.orderNumber}: ${msg}`)
      }
    }
    
    return NextResponse.json({
      ok: true,
      message: `Sincronização concluída`,
      total: pickupsSemTransportadora.length,
      atualizados,
      erros: erros.length > 0 ? erros : undefined
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[Sync Transportadoras] Erro:', message)
    
    return NextResponse.json(
      { ok: false, error: 'Erro ao sincronizar transportadoras', details: message },
      { status: 500 }
    )
  }
}
