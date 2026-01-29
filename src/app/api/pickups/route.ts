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

    console.log('[Pickups] Dados recebidos:', { orderNumber, cpf, retrieverName, trackingCode, transportadora })

    // Buscar responsável (usuário ou operador) se fornecido
    let operatorName: string | null = null
    let operatorId: string | null = null
    
    if (body.operatorId) {
      const isUser = body.operatorId.startsWith('user_')
      const isOperator = body.operatorId.startsWith('op_')
      const realId = isUser ? body.operatorId.replace('user_', '') : 
                     isOperator ? body.operatorId.replace('op_', '') : 
                     body.operatorId
      
      if (isUser) {
        // É um usuário - buscar nome do usuário, operatorId fica NULL (não tem FK para User)
        const user = await prisma.user.findUnique({
          where: { id: realId },
          select: { name: true }
        })
        operatorName = user?.name || null
        operatorId = null // Não salvar FK para operador
      } else {
        // É um operador - buscar nome e salvar ID real
        const operator = await prisma.operator.findUnique({
          where: { id: realId },
          select: { name: true }
        })
        operatorName = operator?.name || null
        operatorId = realId // Salvar ID real do operador
      }
    }

    // NOVA ABORDAGEM: Verificar se existe pickup anterior com status RETORNADO
    // Isso determina se é uma re-retirada de forma confiável, independente de parâmetros de URL
    const existingPickupWithReturn = await prisma.pickup.findFirst({
      where: {
        order: { orderNumber },
        status: 'RETORNADO'  // Pickup que foi marcado como retornado
      },
      include: {
        order: true,
        linhasDoTempo: {
          include: {
            ocorrencias: {
              where: { tipoOcorrencia: 'RETORNO_PRODUTO' }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Contar ocorrências de retorno em todas as linhas do tempo
    const totalOcorrenciasRetorno = existingPickupWithReturn?.linhasDoTempo?.reduce(
      (acc, linha) => acc + (linha.ocorrencias?.length || 0), 0
    ) || 0

    // É re-retirada se existe pickup com status RETORNADO ou com ocorrência de retorno
    const isReRetirada = !!(existingPickupWithReturn && 
      (existingPickupWithReturn.status === 'RETORNADO' || totalOcorrenciasRetorno > 0))
    
    console.log('[Pickups] Verificação de re-retirada:', {
      existePickupAnterior: !!existingPickupWithReturn,
      statusPickup: existingPickupWithReturn?.status,
      temOcorrenciaRetorno: totalOcorrenciasRetorno,
      isReRetirada
    })

    // Se for re-retirada, buscar pedido no banco de dados ao invés da Tiny
    let tinyOrderId: string
    
    if (isReRetirada && existingPickupWithReturn) {
      console.log('[Pickups] Re-retirada detectada - usando dados do banco de dados')
      
      tinyOrderId = existingPickupWithReturn.order.tinyOrderId
      console.log('[Pickups] Pedido encontrado no banco, ID Tiny:', tinyOrderId)
    } else {
      // Primeira retirada - buscar na Tiny normalmente (com todas as validações)
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

    // Verificar se já existe um pickup AGUARDANDO_RETIRADA para este pedido (pode ter sido criado com rastreio)
    // IMPORTANTE: Para re-retiradas, NÃO queremos atualizar um pickup existente, queremos criar um NOVO
    const existingPickup = isReRetirada ? null : await prisma.pickup.findFirst({
      where: { 
        orderId: order.id,
        status: 'AGUARDANDO_RETIRADA' // Só atualiza se estiver aguardando
      }
    })

    // Buscar detalhes completos do pedido para obter vendedor e dados do cliente
    let vendedorNome: string | null = null
    let customerName: string | null = body.retrieverName || null
    const customerCpfCnpj: string | null = cpfDigits || null
    let itensJson: string | null = null  // JSON dos itens para salvar no banco
    
    if (!isReRetirada) {
      // Apenas buscar detalhes na Tiny se for primeira retirada
      try {
        const detalhes = await getTinyOrderDetails(orderNumber)
        if (detalhes) {
          vendedorNome = detalhes.vendedor !== 'Não informado' ? detalhes.vendedor : null
          customerName = detalhes.clienteNome || body.retrieverName || null
          console.log('[Pickups] Vendedor:', vendedorNome)
          
          // Salvar itens como JSON para re-retiradas futuras
          if (detalhes.itens && detalhes.itens.length > 0) {
            itensJson = JSON.stringify(detalhes.itens)
            console.log('[Pickups] Salvando', detalhes.itens.length, 'itens para re-retiradas futuras')
          }
        }
      } catch (err) {
        console.log('[Pickups] Erro ao buscar detalhes:', err)
      }
    } else if (existingPickupWithReturn?.itens) {
      // Re-retirada: copiar itens do pickup anterior
      itensJson = existingPickupWithReturn.itens
      console.log('[Pickups] Re-retirada: copiando itens do pickup anterior')
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
          itens: itensJson || existingPickup.itens || null,  // Salvar itens do pedido
        },
        select: { id: true, cpfLast4: true, operatorId: true, operatorName: true, customerName: true, customerCpfCnpj: true, retrieverName: true, trackingCode: true, transportadora: true, vendedor: true, status: true, photo: true, createdAt: true, itens: true },
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
          itens: itensJson || null,  // Salvar itens do pedido
        },
        select: { id: true, cpfLast4: true, operatorId: true, operatorName: true, customerName: true, customerCpfCnpj: true, retrieverName: true, trackingCode: true, transportadora: true, vendedor: true, status: true, photo: true, createdAt: true, itens: true },
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
