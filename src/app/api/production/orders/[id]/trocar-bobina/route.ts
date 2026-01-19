import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getTinyApiToken } from '@/lib/tiny-api'

// POST - Trocar bobina durante produção
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 })
    }

    const { id: orderId } = await params
    const body = await request.json()
    const { pesoRestante, novaBobinaSku, novaBobinaPeso, novaBobinaOrigem } = body

    if (!novaBobinaSku || !novaBobinaPeso) {
      return NextResponse.json({ ok: false, error: 'Dados da nova bobina são obrigatórios' }, { status: 400 })
    }

    // Verificar se ordem existe e está em andamento
    const order = await prisma.productionOrder.findUnique({
      where: { id: orderId },
      include: {
        bobinas: {
          orderBy: { sequencia: 'desc' },
          take: 1
        }
      }
    })

    if (!order) {
      return NextResponse.json({ ok: false, error: 'Ordem não encontrada' }, { status: 404 })
    }

    if (order.status !== 'EM_ANDAMENTO') {
      return NextResponse.json({ ok: false, error: 'Ordem não está em andamento' }, { status: 400 })
    }

    const bobinaAtual = order.bobinas[0]
    if (!bobinaAtual) {
      return NextResponse.json({ ok: false, error: 'Nenhuma bobina ativa encontrada' }, { status: 404 })
    }

    // Fechar bobina atual
    await prisma.productionBobina.update({
      where: { id: bobinaAtual.id },
      data: {
        pesoRestante: pesoRestante || 0,
        fimAt: new Date()
      }
    })

    // Criar nova bobina
    const novaBobina = await prisma.productionBobina.create({
      data: {
        orderId,
        sequencia: bobinaAtual.sequencia + 1,
        bobinaSku: novaBobinaSku,
        pesoInicial: novaBobinaPeso,
        bobinaOrigem: novaBobinaOrigem || 'EXTRUSORA'
      }
    })

    // Dar saída no estoque da Tiny (bobina consumida)
    try {
      const token = await getTinyApiToken()
      
      const tinyUrl = 'https://api.tiny.com.br/api2/produto.atualizar.estoque.php'
      
      const params = new URLSearchParams({
        token,
        formato: 'json',
        idProduto: novaBobinaSku,
        tipo: 'S', // S = Saída
        quantidade: novaBobinaPeso.toString(),
        observacoes: `Consumo OP ${order.code} - Bobina #${bobinaAtual.sequencia + 1}`
      })

      const tinyResponse = await fetch(`${tinyUrl}?${params}`, {
        method: 'POST'
      })

      const tinyData = await tinyResponse.json()
      
      console.log('[Trocar Bobina] Resposta Tiny saída estoque:', JSON.stringify(tinyData, null, 2))

      if (tinyData.retorno?.status === 'Erro') {
        console.error('[Trocar Bobina] Erro ao dar saída no estoque Tiny:', tinyData.retorno)
      } else {
        console.log('[Trocar Bobina] Saída de estoque realizada:', novaBobinaSku, novaBobinaPeso, 'kg')
      }
    } catch (tinyError) {
      console.error('[Trocar Bobina] Erro ao integrar com Tiny:', tinyError)
      // Não falha a troca se houver erro na Tiny
    }

    // Buscar ordem atualizada
    const updatedOrder = await prisma.productionOrder.findUnique({
      where: { id: orderId },
      include: {
        bobinas: {
          orderBy: { sequencia: 'asc' }
        }
      }
    })

    return NextResponse.json({ ok: true, order: updatedOrder, novaBobina })
  } catch (error) {
    console.error('Erro ao trocar bobina:', error)
    return NextResponse.json({ ok: false, error: 'Erro ao trocar bobina' }, { status: 500 })
  }
}
