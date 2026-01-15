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
    const pedido = await getTinyOrder(orderNumber)
    
    if (!pedido || !pedido.id) {
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

    const dryRunEnv = process.env.TINY_DRY_RUN
    const dryRun = body.dryRun ?? (dryRunEnv ? dryRunEnv !== '0' : false)

    if (!dryRun) {
      console.log('[Pickups] Marcando pedido como enviado...')
      await markOrderAsShipped(orderNumber, tinyOrderId)
      console.log('[Pickups] Pedido marcado como enviado')
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
