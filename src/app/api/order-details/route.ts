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
    
    // NOVA ABORDAGEM: Verificar se existe pickup com status RETORNADO
    // Isso determina se é uma re-retirada de forma confiável
    const existingPickupWithReturn = await prisma.pickup.findFirst({
      where: {
        order: { orderNumber },
        status: 'RETORNADO'
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
    
    console.log('[Order Details API] Verificação de re-retirada:', {
      existePickupAnterior: !!existingPickupWithReturn,
      statusPickup: existingPickupWithReturn?.status,
      temOcorrenciaRetorno: totalOcorrenciasRetorno,
      isReRetirada
    })
    
    // Para re-retiradas, retornar dados do banco (não consulta Tiny)
    if (isReRetirada && existingPickupWithReturn) {
      console.log('[Order Details API] Re-retirada detectada - usando dados do banco')
      
      // Retornar dados do banco para re-retirada
      return NextResponse.json({
        id: existingPickupWithReturn.order.tinyOrderId,
        numero: existingPickupWithReturn.order.orderNumber,
        situacao: 're-retirada', // Status especial para re-retirada (não bloqueia)
        clienteNome: existingPickupWithReturn.customerName || existingPickupWithReturn.retrieverName || 'Cliente',
        vendedor: existingPickupWithReturn.vendedor || 'Não informado',
        transportadora: existingPickupWithReturn.transportadora || 'Não definida',
        itens: [], // Itens não são necessários para re-retirada
        isReRetirada: true // Flag para o frontend saber que é re-retirada
      }, { status: 200 })
    }
    
    // Primeira retirada - buscar detalhes do pedido na Tiny (com todas as validações)
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
