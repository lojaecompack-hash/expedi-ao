import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getTinyApiToken } from '@/lib/tiny-api'

// GET - Listar ordens de produção
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const turno = searchParams.get('turno')

    const where: Record<string, unknown> = {}
    if (status) {
      where.status = status
    }
    if (turno) {
      where.turnoInicial = turno
    }

    const orders = await prisma.productionOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        sessoes: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        _count: {
          select: {
            pacotes: true,
            aparas: true
          }
        }
      },
      take: 50
    })

    return NextResponse.json({ ok: true, orders })
  } catch (error) {
    console.error('Erro ao buscar ordens:', error)
    return NextResponse.json({ ok: false, error: 'Erro ao buscar ordens' }, { status: 500 })
  }
}

// POST - Criar nova ordem de produção
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
    const {
      productSku,
      productName,
      productMeasure,
      bobinaSku,
      bobinaPesoInicial,
      bobinaOrigem,
      turnoInicial,
      machineId,
      operatorId,
      operatorName
    } = body

    // Validações
    if (!productSku || !productName || !productMeasure) {
      return NextResponse.json({ ok: false, error: 'Dados do produto são obrigatórios' }, { status: 400 })
    }
    if (!bobinaSku || !bobinaPesoInicial) {
      return NextResponse.json({ ok: false, error: 'Dados da bobina são obrigatórios' }, { status: 400 })
    }
    if (!turnoInicial || !machineId || !operatorId || !operatorName) {
      return NextResponse.json({ ok: false, error: 'Turno, máquina e operador são obrigatórios' }, { status: 400 })
    }

    // Verificar se máquina existe
    const machine = await prisma.machine.findUnique({ where: { id: machineId } })
    if (!machine) {
      return NextResponse.json({ ok: false, error: 'Máquina não encontrada' }, { status: 404 })
    }

    // Gerar código da OP
    const year = new Date().getFullYear()
    const lastOrder = await prisma.productionOrder.findFirst({
      where: { code: { startsWith: `OP-${year}-` } },
      orderBy: { code: 'desc' }
    })
    
    let nextNumber = 1
    if (lastOrder) {
      const lastNumber = parseInt(lastOrder.code.split('-')[2])
      nextNumber = lastNumber + 1
    }
    const code = `OP-${year}-${String(nextNumber).padStart(4, '0')}`

    // Criar ordem, bobina inicial e sessão inicial
    const order = await prisma.productionOrder.create({
      data: {
        code,
        productSku,
        productName,
        productMeasure,
        turnoInicial,
        createdByUserId: dbUser.id,
        bobinas: {
          create: {
            sequencia: 1,
            bobinaSku,
            pesoInicial: bobinaPesoInicial,
            bobinaOrigem: bobinaOrigem || 'EXTRUSORA'
          }
        },
        sessoes: {
          create: {
            operatorId,
            operatorName,
            machineId,
            turno: turnoInicial
          }
        }
      },
      include: {
        bobinas: true,
        sessoes: true
      }
    })

    // Atualizar máquina com OP atual
    await prisma.machine.update({
      where: { id: machineId },
      data: { currentOrderId: order.id }
    })

    // Dar saída no estoque da Tiny (primeira bobina consumida)
    try {
      const token = await getTinyApiToken()
      
      const tinyUrl = 'https://api.tiny.com.br/api2/produto.atualizar.estoque.php'
      
      const params = new URLSearchParams({
        token,
        formato: 'json',
        idProduto: bobinaSku,
        tipo: 'S', // S = Saída
        quantidade: bobinaPesoInicial.toString(),
        observacoes: `Consumo OP ${code} - Bobina #1`
      })

      const tinyResponse = await fetch(`${tinyUrl}?${params}`, {
        method: 'POST'
      })

      const tinyData = await tinyResponse.json()
      
      console.log('[Criar OP] Resposta Tiny saída estoque bobina:', JSON.stringify(tinyData, null, 2))

      if (tinyData.retorno?.status === 'Erro') {
        console.error('[Criar OP] Erro ao dar saída no estoque Tiny:', tinyData.retorno)
      } else {
        console.log('[Criar OP] Saída de estoque realizada:', bobinaSku, bobinaPesoInicial, 'kg')
      }
    } catch (tinyError) {
      console.error('[Criar OP] Erro ao integrar com Tiny:', tinyError)
      // Não falha a criação se houver erro na Tiny
    }

    return NextResponse.json({ ok: true, order })
  } catch (error) {
    console.error('Erro ao criar ordem:', error)
    return NextResponse.json({ ok: false, error: 'Erro ao criar ordem' }, { status: 500 })
  }
}
