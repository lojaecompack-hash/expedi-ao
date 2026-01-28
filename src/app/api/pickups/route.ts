import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { getTinyOrder, getTinyOrderDetails, markOrderAsShipped } from '@/lib/tiny-api'

function onlyDigits(v: string): string {
  return v.replace(/\D+/g, '')
}

export async function POST(req: Request) {
  try {
    console.log('[Pickups] Iniciando processamento de retirada...')

    const body = (await req.json()) as {
      orderNumber?: string | number
      cpf?: string
      operatorId?: string
      retrieverName?: string
      trackingCode?: string
      transportadora?: string
      photo?: string
      dryRun?: boolean
      retiradaAnteriorId?: string  // ID da retirada anterior (se for uma re-retirada)
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

    const cpf = String(body.cpf ?? '').trim()
    const retrieverName = String(body.retrieverName ?? '').trim()
    const trackingCode = String(body.trackingCode ?? '').trim()
    const transportadora = String(body.transportadora ?? '').trim()
    const photo = body.photo || null

    // Verificar se é uma re-retirada (reenvio após retorno) ANTES de buscar na Tiny
    const isReRetirada = !!body.retiradaAnteriorId
    console.log('[Pickups] É re-retirada?', isReRetirada)
    console.log('[Pickups] Dados recebidos:', { orderNumber, cpf, retrieverName, trackingCode, transportadora, isReRetirada })

    // Buscar operador se fornecido
    let operatorName: string | null = null
    if (body.operatorId) {
      const operator = await prisma.operator.findUnique({
        where: { id: body.operatorId },
        select: { name: true }
      })
      operatorName = operator?.name || null
    }

    // Se for re-retirada, buscar pedido no banco de dados ao invés da Tiny
    let tinyOrderId: string
    
    if (isReRetirada) {
      console.log('[Pickups] Re-retirada detectada - buscando pedido no banco de dados')
      
      // Buscar pelo número do pedido no banco
      const existingOrder = await prisma.order.findFirst({
        where: { orderNumber },
        select: { id: true, tinyOrderId: true, orderNumber: true }
      })
      
      if (!existingOrder) {
        console.error('[Pickups] Pedido não encontrado no banco de dados para re-retirada')
        return NextResponse.json(
          { ok: false, error: 'Pedido não encontrado no sistema para re-retirada' },
          { status: 404 }
        )
      }
      
      tinyOrderId = existingOrder.tinyOrderId
      console.log('[Pickups] Pedido encontrado no banco, ID Tiny:', tinyOrderId)
    } else {
      // Primeira retirada - buscar na Tiny normalmente
      console.log('[Pickups] Primeira retirada - buscando pedido no Tiny:', orderNumber)
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

      tinyOrderId = String(pedido.id)
      console.log('[Pickups] Pedido encontrado, ID:', tinyOrderId)
    }

    const operatorId = body.operatorId || null
    const cpfLast4 = cpfDigits.slice(-4)

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

    // Bloquear apenas se NÃO for re-retirada
    if (!isReRetirada && existingOrder && existingOrder.statusTiny === 'enviado') {
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

    // Não marcar na Tiny se for re-retirada (pedido já foi marcado como enviado anteriormente)
    if (!dryRun && !isReRetirada) {
      console.log('[Pickups] Marcando pedido como enviado na Tiny...')
      try {
        await markOrderAsShipped(orderNumber, tinyOrderId)
        console.log('[Pickups] Pedido marcado como enviado com sucesso')
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error'
        console.error('[Pickups] Erro ao marcar como enviado:', msg)
        throw error
      }
    } else if (isReRetirada) {
      console.log('[Pickups] Re-retirada: pulando marcação na Tiny (pedido já foi enviado anteriormente)')
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

    // Verificar se já existe um pickup para este pedido (pode ter sido criado com rastreio)
    const existingPickup = await prisma.pickup.findFirst({
      where: { orderId: order.id }
    })

    // Buscar detalhes completos do pedido para obter vendedor e dados do cliente
    let vendedorNome: string | null = null
    let customerName: string | null = body.retrieverName || null
    const customerCpfCnpj: string | null = cpfDigits || null
    
    if (!isReRetirada) {
      // Apenas buscar detalhes na Tiny se for primeira retirada
      try {
        const detalhes = await getTinyOrderDetails(orderNumber)
        if (detalhes) {
          vendedorNome = detalhes.vendedor !== 'Não informado' ? detalhes.vendedor : null
          customerName = detalhes.clienteNome || body.retrieverName || null
          console.log('[Pickups] Vendedor:', vendedorNome)
        }
      } catch (err) {
        console.log('[Pickups] Erro ao buscar detalhes:', err)
      }
    }
    
    // Usar transportadora enviada pelo frontend
    const transportadoraNome = body.transportadora && body.transportadora.trim() !== '' ? body.transportadora.trim() : null
    console.log('[Pickups] Transportadora selecionada:', transportadoraNome)

    let pickup
    if (existingPickup) {
      // Atualizar pickup existente (preservar rastreio se já existir, status = RETIRADO)
      pickup = await prisma.pickup.update({
        where: { id: existingPickup.id },
        data: {
          cpfLast4,
          operatorId,
          operatorName,
          customerName,
          customerCpfCnpj,
          retrieverName: body.retrieverName || null,
          trackingCode: body.trackingCode || existingPickup.trackingCode || null,
          transportadora: typeof transportadoraNome === 'string' ? transportadoraNome : existingPickup.transportadora || null,
          vendedor: typeof vendedorNome === 'string' ? vendedorNome : existingPickup.vendedor || null,
          status: 'RETIRADO',
          photo: body.photo || null,
        },
        select: { id: true, cpfLast4: true, operatorId: true, operatorName: true, customerName: true, customerCpfCnpj: true, retrieverName: true, trackingCode: true, transportadora: true, vendedor: true, status: true, photo: true, createdAt: true },
      })
      console.log('[Pickups] Pickup atualizado com status RETIRADO:', pickup.id)
    } else {
      // Contar quantas retiradas já existem para este pedido
      const retiradasExistentes = await prisma.pickup.count({
        where: { orderId: order.id }
      })
      const numeroRetirada = retiradasExistentes + 1
      
      // Criar novo pickup (status = RETIRADO pois é retirada completa)
      pickup = await prisma.pickup.create({
        data: {
          orderId: order.id,
          cpfLast4,
          operatorId,
          operatorName,
          customerName,
          customerCpfCnpj,
          retrieverName: body.retrieverName || null,
          trackingCode: body.trackingCode || null,
          transportadora: typeof transportadoraNome === 'string' ? transportadoraNome : null,
          vendedor: typeof vendedorNome === 'string' ? vendedorNome : null,
          status: 'RETIRADO',
          photo: body.photo || null,
          retiradaAnteriorId: body.retiradaAnteriorId || null,
          numeroRetirada,
        },
        select: { id: true, cpfLast4: true, operatorId: true, operatorName: true, customerName: true, customerCpfCnpj: true, retrieverName: true, trackingCode: true, transportadora: true, vendedor: true, status: true, photo: true, createdAt: true },
      })
      console.log('[Pickups] Pickup criado com status RETIRADO:', pickup.id, 'Retirada #' + numeroRetirada, body.retiradaAnteriorId ? '(re-retirada de ' + body.retiradaAnteriorId + ')' : '')
    }

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
