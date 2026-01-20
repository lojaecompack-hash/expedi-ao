import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getTinyApiToken } from '@/lib/tiny-api'

// GET - Listar ordens aguardando conferência (agrupadas por turno)
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

    // Agrupar por turno
    const groupedByTurno: Record<string, typeof orders> = {}
    orders.forEach(order => {
      const turno = order.turnoInicial
      if (!groupedByTurno[turno]) {
        groupedByTurno[turno] = []
      }
      groupedByTurno[turno].push(order)
    })

    return NextResponse.json({ ok: true, orders, groupedByTurno })
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

    // Dar entrada no estoque da Tiny (produto final produzido)
    let tinyIntegrationResult: { success: boolean; error: string | null; data: unknown } = { success: false, error: null, data: null }
    try {
      const token = await getTinyApiToken()
      
      if (!token) {
        console.error('[Conferencia] Token Tiny nao encontrado')
        tinyIntegrationResult.error = 'Token nao encontrado'
      } else {
        const tinyUrl = 'https://api.tiny.com.br/api2/produto.atualizar.estoque.php'
        
        const params = new URLSearchParams({
          token,
          formato: 'json',
          idProduto: order.productSku,
          tipo: 'E',
          quantidade: pacotesConferido.toString(),
          observacoes: `Producao OP ${order.code} - Conferencia`
        })

        console.log('[Conferencia] Enviando para Tiny:', {
          url: tinyUrl,
          idProduto: order.productSku,
          tipo: 'E',
          quantidade: pacotesConferido,
          observacoes: `Producao OP ${order.code} - Conferencia`
        })

        const tinyResponse = await fetch(`${tinyUrl}?${params}`, {
          method: 'POST'
        })

        const tinyData = await tinyResponse.json()
        
        console.log('[Conferencia] Resposta Tiny entrada estoque:', JSON.stringify(tinyData, null, 2))

        if (tinyData.retorno?.status === 'Erro') {
          console.error('[Conferencia] Erro ao dar entrada no estoque Tiny:', tinyData.retorno)
          tinyIntegrationResult.error = tinyData.retorno.erros?.[0]?.erro || 'Erro desconhecido'
          tinyIntegrationResult.data = tinyData.retorno
        } else {
          console.log('[Conferencia] Entrada de estoque realizada com sucesso:', order.productSku, pacotesConferido, 'un')
          tinyIntegrationResult.success = true
          tinyIntegrationResult.data = tinyData.retorno
        }
      }
    } catch (tinyError) {
      console.error('[Conferencia] Erro ao integrar com Tiny:', tinyError)
      tinyIntegrationResult.error = tinyError instanceof Error ? tinyError.message : String(tinyError)
    }

    return NextResponse.json({ 
      ok: true, 
      order: updated,
      divergencia: hasDivergencia,
      consumoEstimado: {
        cola: consumoCola,
        line: consumoLine
      },
      tinyIntegration: tinyIntegrationResult
    })
  } catch (error) {
    console.error('Erro ao realizar conferência:', error)
    return NextResponse.json({ ok: false, error: 'Erro ao realizar conferência' }, { status: 500 })
  }
}
