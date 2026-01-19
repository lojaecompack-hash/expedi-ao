import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getTinyApiToken } from '@/lib/tiny-api'

// GET - Listar ordens aguardando conferência
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 })
    }

    const orders = await prisma.productionOrder.findMany({
      where: { status: 'AGUARDANDO_CONF' },
      orderBy: { finishedAt: 'asc' },
      include: {
        pacotes: true,
        sessoes: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { machine: true }
        }
      }
    })

    return NextResponse.json({ ok: true, orders })
  } catch (error) {
    console.error('Erro ao buscar ordens para conferência:', error)
    return NextResponse.json({ ok: false, error: 'Erro ao buscar ordens' }, { status: 500 })
  }
}

// POST - Realizar conferência
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: authUser.email! }
    })

    if (!dbUser) {
      return NextResponse.json({ ok: false, error: 'Usuário não encontrado' }, { status: 404 })
    }

    const body = await request.json()
    const { orderId, pesoConferido, unidadesConferido, pacotesConferido, observacao } = body

    if (!orderId) {
      return NextResponse.json({ ok: false, error: 'ID da ordem é obrigatório' }, { status: 400 })
    }

    const order = await prisma.productionOrder.findUnique({ where: { id: orderId } })
    if (!order) {
      return NextResponse.json({ ok: false, error: 'Ordem não encontrada' }, { status: 404 })
    }
    if (order.status !== 'AGUARDANDO_CONF') {
      return NextResponse.json({ ok: false, error: 'Ordem não está aguardando conferência' }, { status: 400 })
    }

    // Verificar divergência
    const pesoOperador = Number(order.pesoTotalProduzido || 0)
    const unidadesOperador = order.totalUnidades || 0
    const pacotesOperador = order.totalPacotes || 0

    const hasDivergencia = 
      pesoConferido !== pesoOperador ||
      unidadesConferido !== unidadesOperador ||
      pacotesConferido !== pacotesOperador

    // Se há divergência, registrar log
    if (hasDivergencia) {
      await prisma.productionDivergencia.create({
        data: {
          orderId,
          qtdOperador: unidadesOperador,
          pesoOperador,
          pacotesOperador,
          qtdConferido: unidadesConferido,
          pesoConferido,
          pacotesConferido,
          qtdDiferenca: unidadesConferido - unidadesOperador,
          pesoDiferenca: pesoConferido - pesoOperador,
          ajustadoPorId: dbUser.id,
          ajustadoPorName: dbUser.name,
          observacao
        }
      })
    }

    // Buscar configuração para calcular consumo
    const config = await prisma.productionConfig.findFirst()
    let consumoCola = null
    let consumoLine = null

    if (config) {
      if (config.colaPercent) {
        consumoCola = pesoConferido * (Number(config.colaPercent) / 100)
      }
      if (config.lineMetrosPorKg) {
        consumoLine = pesoConferido * Number(config.lineMetrosPorKg)
      }
    }

    // Atualizar ordem com dados conferidos (ajusta automaticamente)
    const updated = await prisma.productionOrder.update({
      where: { id: orderId },
      data: {
        confPesoReal: pesoConferido,
        confUnidadesReal: unidadesConferido,
        confPacotesReal: pacotesConferido,
        confDivergencia: hasDivergencia,
        confObservacao: observacao,
        confUserId: dbUser.id,
        confAt: new Date(),
        // Ajustar valores da produção para o conferido
        pesoTotalProduzido: pesoConferido,
        totalUnidades: unidadesConferido,
        totalPacotes: pacotesConferido,
        consumoCola,
        consumoLine,
        status: 'CONFERIDO'
      }
    })

    // Marcar pacotes como conferidos
    await prisma.productionPackage.updateMany({
      where: { orderId },
      data: { conferido: true, conferidoAt: new Date() }
    })

    // Dar entrada no estoque da Tiny
    try {
      const token = await getTinyApiToken()
      
      // Criar nota de entrada no Tiny
      const notaEntrada = {
        nota: {
          tipo: 'E', // Entrada
          natureza_operacao: 'Produção Interna',
          data_emissao: new Date().toISOString().split('T')[0],
          itens: [{
            item: {
              codigo: order.productSku,
              descricao: order.productName,
              unidade: 'UN',
              quantidade: pacotesConferido.toString()
            }
          }]
        }
      }

      const tinyUrl = 'https://api.tiny.com.br/api2/nota.fiscal.incluir.php'
      const params = new URLSearchParams({
        token,
        formato: 'json',
        nota: JSON.stringify(notaEntrada)
      })

      const tinyResponse = await fetch(`${tinyUrl}?${params}`, {
        method: 'POST'
      })

      const tinyData = await tinyResponse.json()
      
      console.log('[Conferência] Resposta Tiny entrada estoque:', tinyData)

      if (tinyData.retorno?.status === 'Erro') {
        console.error('[Conferência] Erro ao dar entrada no estoque Tiny:', tinyData.retorno)
      }
    } catch (tinyError) {
      console.error('[Conferência] Erro ao integrar com Tiny:', tinyError)
      // Não falha a conferência se houver erro na Tiny
    }

    return NextResponse.json({ 
      ok: true, 
      order: updated,
      divergencia: hasDivergencia,
      consumoEstimado: {
        cola: consumoCola,
        line: consumoLine
      }
    })
  } catch (error) {
    console.error('Erro ao realizar conferência:', error)
    return NextResponse.json({ ok: false, error: 'Erro ao realizar conferência' }, { status: 500 })
  }
}
