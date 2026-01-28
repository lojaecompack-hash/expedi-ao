import { NextResponse } from 'next/server'
import { getTinyOrderDetails } from '@/lib/tiny-api'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const number = searchParams.get('number')
    const isReRetirada = searchParams.get('reRetirada') === 'true'
    
    // Validação
    if (!number || number.trim().length === 0) {
      return NextResponse.json(
        { error: 'Número do pedido inválido' },
        { status: 400 }
      )
    }
    
    console.log('[Order Details API] Buscando pedido:', number, 'Re-retirada:', isReRetirada)
    
    // Para re-retiradas, buscar dados do banco primeiro
    if (isReRetirada) {
      console.log('[Order Details API] Re-retirada - buscando no banco de dados')
      
      const existingPickup = await prisma.pickup.findFirst({
        where: {
          order: { orderNumber: number }
        },
        include: {
          order: true
        },
        orderBy: { createdAt: 'desc' }
      })
      
      if (existingPickup) {
        console.log('[Order Details API] Pickup encontrado no banco:', existingPickup.id)
        
        // Retornar dados do banco para re-retirada
        return NextResponse.json({
          id: existingPickup.order.tinyOrderId,
          numero: existingPickup.order.orderNumber,
          situacao: 'enviado', // Status esperado para re-retirada
          clienteNome: existingPickup.customerName || existingPickup.retrieverName || 'Cliente',
          vendedor: existingPickup.vendedor || 'Não informado',
          transportadora: existingPickup.transportadora || 'Não definida',
          itens: [] // Itens não são necessários para re-retirada
        }, { status: 200 })
      }
    }
    
    // Buscar detalhes do pedido na Tiny (primeira retirada ou fallback)
    const details = await getTinyOrderDetails(number)
    
    if (!details) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      )
    }
    
    console.log('[Order Details API] Pedido encontrado:', details.numero)
    
    return NextResponse.json(details, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[Order Details API] Erro:', message)
    
    return NextResponse.json(
      { error: 'Erro ao buscar detalhes do pedido', details: message },
      { status: 500 }
    )
  }
}
