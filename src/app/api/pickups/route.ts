import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

import { prisma } from '@/lib/prisma'
import { setPedidoSituacao, tinyFetch } from '@/lib/tiny'

function onlyDigits(v: string): string {
  return v.replace(/\D+/g, '')
}

type TinyPedidoListItem = {
  id?: number
}

type TinyPedidoListResponse = {
  itens?: TinyPedidoListItem[]
}

export async function POST(req: Request) {
  try {
    const accessToken = (await cookies()).get('tiny_access_token')?.value
    if (!accessToken) {
      return NextResponse.json(
        { ok: false, error: 'Not authenticated. Open /api/tiny/auth first.' },
        { status: 401 },
      )
    }

    const body = (await req.json()) as {
      orderNumber?: string | number
      cpf?: string
      operator?: string
      dryRun?: boolean
    }

    const orderNumberRaw = String(body.orderNumber ?? '').trim()
    const orderNumberDigits = onlyDigits(orderNumberRaw)
    const orderNumber = Number(orderNumberDigits)

    if (!Number.isFinite(orderNumber) || orderNumber <= 0) {
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

    const list = await tinyFetch<TinyPedidoListResponse>(
      `/pedidos?numero=${encodeURIComponent(String(orderNumber))}&limit=1&offset=0`,
      { method: 'GET' },
      accessToken,
    )

    if (list.status < 200 || list.status >= 300) {
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch pedido by numero', tiny: list },
        { status: 502 },
      )
    }

    const itens = list.data?.itens
    const first = itens?.[0]
    const idPedido = Number(first?.id)

    if (!Number.isFinite(idPedido) || idPedido <= 0) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Pedido não encontrado no Tiny para este número',
          debug: { orderNumber, received: list.data },
        },
        { status: 404 },
      )
    }

    const dryRunEnv = process.env.TINY_DRY_RUN
    const dryRun = body.dryRun ?? (dryRunEnv ? dryRunEnv !== '0' : false)

    if (!dryRun) {
      const result = await setPedidoSituacao({ idPedido, situacao: 5, token: accessToken })

      if (result.status < 200 || result.status >= 300) {
        return NextResponse.json(
          { ok: false, error: 'Failed to update pedido situacao', tiny: result },
          { status: 502 },
        )
      }
    }

    const tinyOrderId = String(idPedido)

    const order = await prisma.order.upsert({
      where: { tinyOrderId },
      update: {
        orderNumber: String(orderNumber),
        statusTiny: '5',
        statusInterno: 'RETIRADO',
      },
      create: {
        tinyOrderId,
        orderNumber: String(orderNumber),
        statusTiny: '5',
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
        idPedido,
        situacao: 5,
      },
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
