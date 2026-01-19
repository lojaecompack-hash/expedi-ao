import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// POST - Lançar apara
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
    const { peso, operatorId, operatorName, machineId, turno } = body

    if (!peso || peso <= 0) {
      return NextResponse.json({ ok: false, error: 'Peso da apara é obrigatório' }, { status: 400 })
    }

    if (!operatorId || !operatorName || !machineId || !turno) {
      return NextResponse.json({ ok: false, error: 'Dados incompletos' }, { status: 400 })
    }

    // Verificar se ordem existe e está em andamento
    const order = await prisma.productionOrder.findUnique({ where: { id: orderId } })
    if (!order) {
      return NextResponse.json({ ok: false, error: 'Ordem não encontrada' }, { status: 404 })
    }
    if (order.status !== 'EM_ANDAMENTO') {
      return NextResponse.json({ ok: false, error: 'Ordem não está em andamento' }, { status: 400 })
    }

    // Criar apara
    const apara = await prisma.productionApara.create({
      data: {
        orderId,
        peso,
        operatorId,
        operatorName,
        machineId,
        turno
      }
    })

    // Atualizar total de apara na ordem
    const totalApara = await prisma.productionApara.aggregate({
      where: { orderId },
      _sum: { peso: true }
    })

    await prisma.productionOrder.update({
      where: { id: orderId },
      data: { totalApara: totalApara._sum.peso || 0 }
    })

    return NextResponse.json({ ok: true, apara, totalApara: totalApara._sum.peso || 0 })
  } catch (error) {
    console.error('Erro ao lançar apara:', error)
    return NextResponse.json({ ok: false, error: 'Erro ao lançar apara' }, { status: 500 })
  }
}
