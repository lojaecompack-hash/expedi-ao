import { NextResponse } from 'next/server'
import { getTinyOrderDetails } from '@/lib/tiny-api'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const number = searchParams.get('number')
    
    // Validação
    if (!number || number.trim().length === 0) {
      return NextResponse.json(
        { error: 'Número do pedido inválido' },
        { status: 400 }
      )
    }
    
    // Extrair apenas dígitos do número do pedido
    const orderNumber = number.replace(/\D+/g, '')
    
    console.log('[Order Details API] Buscando pedido:', orderNumber)
    
    // Verificar se existe algum pickup para este pedido
    const existingPickup = await prisma.pickup.findFirst({
      where: {
        order: { orderNumber }
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

    console.log('[Order Details API] Pickup existente:', {
      existe: !!existingPickup,
      status: existingPickup?.status
    })

    // CASO 1: Existe pickup com status RETORNADO -> É re-retirada, buscar dados do BANCO
    if (existingPickup && existingPickup.status === 'RETORNADO') {
      console.log('[Order Details API] Re-retirada detectada (status RETORNADO) - buscando produtos do BANCO')
      
      // Buscar itens salvos no pickup anterior (não da Tiny)
      let itensDoPickup: Array<{id: string, descricao: string, quantidade: number}> = []
      
      if (existingPickup.itens) {
        try {
          itensDoPickup = JSON.parse(existingPickup.itens)
          console.log('[Order Details API] Itens encontrados no banco:', itensDoPickup.length)
        } catch (e) {
          console.error('[Order Details API] Erro ao parsear itens do banco:', e)
        }
      } else {
        console.log('[Order Details API] Pickup anterior não tem itens salvos')
      }
      
      return NextResponse.json({
        id: existingPickup.order.tinyOrderId,
        numero: existingPickup.order.orderNumber,
        situacao: 're-retirada', // Status especial para re-retirada (não bloqueia)
        clienteNome: existingPickup.customerName || existingPickup.retrieverName || 'Cliente',
        vendedor: existingPickup.vendedor || 'Não informado',
        transportadora: existingPickup.transportadora || 'Não definida',
        itens: itensDoPickup,
        isReRetirada: true
      }, { status: 200 })
    }
    
    // CASO 2: Existe pickup com status RETIRADO (não RETORNADO) -> Pedido já foi enviado, BLOQUEAR
    if (existingPickup && existingPickup.status === 'RETIRADO') {
      console.log('[Order Details API] Pedido já foi enviado (status RETIRADO) - bloqueando')
      
      return NextResponse.json({
        id: existingPickup.order.tinyOrderId,
        numero: existingPickup.order.orderNumber,
        situacao: 'enviado', // Status que será bloqueado pelo frontend
        clienteNome: existingPickup.customerName || existingPickup.retrieverName || 'Cliente',
        vendedor: existingPickup.vendedor || 'Não informado',
        transportadora: existingPickup.transportadora || 'Não definida',
        itens: [],
        jaEnviado: true // Flag para indicar que já foi enviado
      }, { status: 200 })
    }
    
    // CASO 3: Não existe pickup -> Primeira retirada, buscar na Tiny normalmente
    console.log('[Order Details API] Primeira retirada - buscando na Tiny')
    const details = await getTinyOrderDetails(orderNumber)
    
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
