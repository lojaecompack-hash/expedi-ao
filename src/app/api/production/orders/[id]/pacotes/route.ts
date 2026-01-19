import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// POST - Criar pacote e gerar etiqueta
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
    const { quantidade, operatorName, machineName, turno } = body

    if (!quantidade || (quantidade !== 500 && quantidade !== 1000)) {
      return NextResponse.json({ ok: false, error: 'Quantidade deve ser 500 ou 1000' }, { status: 400 })
    }

    // Verificar se ordem existe e está em andamento
    const order = await prisma.productionOrder.findUnique({ where: { id: orderId } })
    if (!order) {
      return NextResponse.json({ ok: false, error: 'Ordem não encontrada' }, { status: 404 })
    }
    if (order.status !== 'EM_ANDAMENTO') {
      return NextResponse.json({ ok: false, error: 'Ordem não está em andamento' }, { status: 400 })
    }

    // Buscar sessão ativa
    const session = await prisma.productionSession.findFirst({
      where: { orderId, fimAt: null },
      include: { machine: true }
    })

    // Calcular próxima sequência
    const lastPackage = await prisma.productionPackage.findFirst({
      where: { orderId },
      orderBy: { sequencia: 'desc' }
    })
    const sequencia = (lastPackage?.sequencia || 0) + 1

    // Gerar código da etiqueta (SKU do produto)
    const etiquetaCodigo = `${order.productSku}-${order.code}-${String(sequencia).padStart(3, '0')}`

    // Criar pacote
    const pacote = await prisma.productionPackage.create({
      data: {
        orderId,
        sequencia,
        quantidade,
        sessionId: session?.id,
        operatorName: operatorName || session?.operatorName,
        machineName: machineName || session?.machine?.name,
        turno: turno || session?.turno,
        etiquetaCodigo,
        etiquetaGerada: false
      }
    })

    // Atualizar totais na ordem
    await prisma.productionOrder.update({
      where: { id: orderId },
      data: {
        totalPacotes: { increment: 1 },
        totalUnidades: { increment: quantidade }
      }
    })

    return NextResponse.json({ 
      ok: true, 
      pacote,
      etiqueta: {
        codigo: etiquetaCodigo,
        medida: order.productMeasure,
        quantidade,
        data: new Date().toLocaleDateString('pt-BR'),
        turno: turno || session?.turno,
        maquina: machineName || session?.machine?.code,
        operador: operatorName || session?.operatorName,
        material: order.productName,
        sku: order.productSku
      }
    })
  } catch (error) {
    console.error('Erro ao criar pacote:', error)
    return NextResponse.json({ ok: false, error: 'Erro ao criar pacote' }, { status: 500 })
  }
}

// GET - Listar pacotes da ordem
export async function GET(
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

    const pacotes = await prisma.productionPackage.findMany({
      where: { orderId },
      orderBy: { sequencia: 'asc' }
    })

    return NextResponse.json({ ok: true, pacotes })
  } catch (error) {
    console.error('Erro ao buscar pacotes:', error)
    return NextResponse.json({ ok: false, error: 'Erro ao buscar pacotes' }, { status: 500 })
  }
}
