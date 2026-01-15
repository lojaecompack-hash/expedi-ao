import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { getTinyOrder, markOrderAsShipped } from '@/lib/tiny-api'

function onlyDigits(v: string): string {
  return v.replace(/\D+/g, '')
}

export async function POST(req: Request) {
  try {
    console.log('[Pickups] Iniciando processamento de retirada...')

    const body = (await req.json()) as {
      orderNumber?: string | number
      cpf?: string
      operator?: string
      dryRun?: boolean
    }

    const orderNumberRaw = String(body.orderNumber ?? '').trim()
    const orderNumberDigits = onlyDigits(orderNumberRaw)
    const orderNumber = orderNumberDigits

    if (!orderNumber) {
      return NextResponse.json(
        { ok: false, error: 'Missing or invalid orderNumber (numero do pedido Tiny)' },
        { status: 400 },
      )
    }

    const cpfRaw = String(body.cpf ?? '').trim()
    const cpfDigits = onlyDigits(cpfRaw)
    if (cpfDigits.length !== 11) {
      return NextResponse.json(
        { ok: false, error: 'CPF inválido (precisa ter 11 dígitos)' },
        { status: 400 },
      )
    }

    const operator = (body.operator ? String(body.operator) : '').trim() || null
    const cpfLast4 = cpfDigits.slice(-4)

    console.log('[Pickups] Buscando pedido no Tiny:', orderNumber)
    let pedido
    try {
      pedido = await getTinyOrder(orderNumber)
      console.log('[Pickups] getTinyOrder retornou:', pedido ? 'pedido encontrado' : 'undefined')
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      console.error('[Pickups] Erro ao buscar pedido:', msg)
      throw error
    }
    
    if (!pedido || !pedido.id) {
      console.error('[Pickups] Pedido não encontrado ou sem ID')
      return NextResponse.json(
        {
          ok: false,
          error: 'Pedido não encontrado no Tiny para este número',
        },
        { status: 404 },
      )
    }

    const tinyOrderId = String(pedido.id)
    console.log('[Pickups] Pedido encontrado, ID:', tinyOrderId)

    // Verificar se pedido já foi retirado (banco de dados)
    const existingOrder = await prisma.order.findUnique({
      where: { tinyOrderId },
      select: {
        id: true,
        tinyOrderId: true,
        orderNumber: true,
        statusTiny: true,
        statusInterno: true,
        pickups: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            createdAt: true,
            operator: true
          }
        }
      }
    })

    if (existingOrder && existingOrder.statusTiny === 'enviado') {
      const primeiraRetirada = existingOrder.pickups[0]
      console.log('[Pickups] Pedido já foi retirado anteriormente')
      return NextResponse.json({
        ok: false,
        error: 'Este pedido já foi retirado anteriormente',
        details: {
          pedido: existingOrder.orderNumber,
          statusAtual: existingOrder.statusTiny,
          primeiraRetirada: primeiraRetirada?.createdAt,
          operadorAnterior: primeiraRetirada?.operator || 'Não informado'
        }
      }, { status: 400 })
    }

    const dryRunEnv = process.env.TINY_DRY_RUN
    const dryRun = body.dryRun ?? (dryRunEnv ? dryRunEnv !== '0' : false)

    if (!dryRun) {
      console.log('[Pickups] Marcando pedido como enviado...')
      try {
        await markOrderAsShipped(orderNumber, tinyOrderId)
        console.log('[Pickups] Pedido marcado como enviado com sucesso')
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error'
        console.error('[Pickups] Erro ao marcar como enviado:', msg)
        throw error
      }
    }

    const order = await prisma.order.upsert({
      where: { tinyOrderId },
      update: {
        orderNumber,
        statusTiny: 'enviado',
        statusInterno: 'RETIRADO',
      },
      create: {
        tinyOrderId,
        orderNumber,
        statusTiny: 'enviado',
        statusInterno: 'RETIRADO',
      },
      select: { id: true, tinyOrderId: true, orderNumber: true },
    })

    const pickup = await prisma.pickup.create({
      data: {
        orderId: order.id,
        cpfLast4,
        operator,
      },
      select: { id: true, cpfLast4: true, operator: true, createdAt: true },
    })

    return NextResponse.json({
      ok: true,
      dryRun,
      order,
      pickup,
      tiny: {
        idPedido: tinyOrderId,
        situacao: 'enviado',
      },
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    console.error('[Pickups] Erro:', message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
