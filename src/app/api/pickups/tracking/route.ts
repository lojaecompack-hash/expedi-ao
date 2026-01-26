import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTinyOrder } from '@/lib/tiny-api'

// Salvar código de rastreio para um pedido (antes da retirada completa)
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { orderNumber, trackingCode, operatorId } = body

    console.log('[Tracking API] Salvando rastreio:', { orderNumber, trackingCode, operatorId })

    if (!orderNumber) {
      return NextResponse.json(
        { ok: false, error: 'Número do pedido é obrigatório' },
        { status: 400 }
      )
    }

    if (!trackingCode || !trackingCode.trim()) {
      return NextResponse.json(
        { ok: false, error: 'Código de rastreio é obrigatório' },
        { status: 400 }
      )
    }

    // Primeiro, tentar buscar pedido no banco local
    let order = await prisma.order.findFirst({
      where: { orderNumber: orderNumber.toString() }
    })

    // Se não encontrar localmente, buscar no Tiny e criar Order local
    if (!order) {
      console.log('[Tracking API] Pedido não encontrado localmente, buscando no Tiny...')
      
      try {
        const pedidoTiny = await getTinyOrder(orderNumber.toString())
        
        if (!pedidoTiny || !pedidoTiny.id) {
          return NextResponse.json(
            { ok: false, error: 'Pedido não encontrado no Tiny' },
            { status: 404 }
          )
        }

        console.log('[Tracking API] Pedido encontrado no Tiny:', pedidoTiny.id)

        // Criar Order local com status NOVO (não altera status no Tiny)
        const situacaoTiny = typeof pedidoTiny.situacao === 'string' ? pedidoTiny.situacao : 'preparando_envio'
        order = await prisma.order.create({
          data: {
            tinyOrderId: String(pedidoTiny.id),
            orderNumber: orderNumber.toString(),
            statusTiny: situacaoTiny,
            statusInterno: 'NOVO',
          }
        })
        console.log('[Tracking API] Order local criada:', order.id)
      } catch (tinyError) {
        const msg = tinyError instanceof Error ? tinyError.message : 'Erro desconhecido'
        console.error('[Tracking API] Erro ao buscar no Tiny:', msg)
        return NextResponse.json(
          { ok: false, error: 'Erro ao buscar pedido no Tiny', details: msg },
          { status: 500 }
        )
      }
    }

    // Buscar nome do operador se fornecido
    let operatorName: string | null = null
    if (operatorId) {
      const operator = await prisma.operator.findUnique({
        where: { id: operatorId },
        select: { name: true }
      })
      operatorName = operator?.name || null
    }

    // Verificar se já existe um pickup para este pedido
    const existingPickup = await prisma.pickup.findFirst({
      where: { orderId: order.id }
    })

    let pickup
    if (existingPickup) {
      // Atualizar pickup existente com o rastreio
      pickup = await prisma.pickup.update({
        where: { id: existingPickup.id },
        data: {
          trackingCode: trackingCode.trim(),
          operatorId: operatorId || existingPickup.operatorId,
          operatorName: operatorName || existingPickup.operatorName,
        }
      })
      console.log('[Tracking API] Pickup atualizado:', pickup.id)
    } else {
      // Criar novo pickup apenas com o rastreio (status = AGUARDANDO_RETIRADA)
      pickup = await prisma.pickup.create({
        data: {
          orderId: order.id,
          trackingCode: trackingCode.trim(),
          operatorId: operatorId || null,
          operatorName: operatorName || 'Rastreio Salvo',
          status: 'AGUARDANDO_RETIRADA',
        }
      })
      console.log('[Tracking API] Pickup criado com status AGUARDANDO_RETIRADA:', pickup.id)
    }

    return NextResponse.json({
      ok: true,
      message: 'Rastreio salvo com sucesso',
      pickup: {
        id: pickup.id,
        trackingCode: pickup.trackingCode,
        operatorName: pickup.operatorName,
      },
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        tinyOrderId: order.tinyOrderId,
      }
    }, { status: 200 })

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[Tracking API] Erro:', message)

    return NextResponse.json(
      { ok: false, error: 'Erro ao salvar rastreio', details: message },
      { status: 500 }
    )
  }
}

// Buscar rastreio de um pedido
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const orderNumber = searchParams.get('orderNumber')

    if (!orderNumber) {
      return NextResponse.json(
        { ok: false, error: 'Número do pedido é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar pedido pelo número
    const order = await prisma.order.findFirst({
      where: { orderNumber: orderNumber.toString() }
    })

    if (!order) {
      return NextResponse.json(
        { ok: false, error: 'Pedido não encontrado', trackingCode: null },
        { status: 404 }
      )
    }

    // Buscar pickup do pedido
    const pickup = await prisma.pickup.findFirst({
      where: { orderId: order.id }
    })

    return NextResponse.json({
      ok: true,
      trackingCode: pickup?.trackingCode || null,
      pickup: pickup ? {
        id: pickup.id,
        trackingCode: pickup.trackingCode,
        operatorName: pickup.operatorName,
        retrieverName: pickup.retrieverName,
        createdAt: pickup.createdAt,
      } : null
    }, { status: 200 })

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[Tracking API] Erro GET:', message)

    return NextResponse.json(
      { ok: false, error: 'Erro ao buscar rastreio', details: message },
      { status: 500 }
    )
  }
}
