import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// GET - Buscar ordem específica
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

    const { id } = await params

    const order = await prisma.productionOrder.findUnique({
      where: { id },
      include: {
        sessoes: {
          orderBy: { createdAt: 'desc' },
          include: {
            machine: true
          }
        },
        pacotes: {
          orderBy: { sequencia: 'asc' }
        },
        aparas: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ ok: false, error: 'Ordem não encontrada' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, order })
  } catch (error) {
    console.error('Erro ao buscar ordem:', error)
    return NextResponse.json({ ok: false, error: 'Erro ao buscar ordem' }, { status: 500 })
  }
}

// PUT - Atualizar ordem (peso, finalizar, etc)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { action, ...data } = body

    const order = await prisma.productionOrder.findUnique({ where: { id } })
    if (!order) {
      return NextResponse.json({ ok: false, error: 'Ordem não encontrada' }, { status: 404 })
    }

    // Ação: Atualizar peso total
    if (action === 'UPDATE_PESO') {
      const { pesoTotalProduzido } = data
      if (pesoTotalProduzido === undefined) {
        return NextResponse.json({ ok: false, error: 'Peso é obrigatório' }, { status: 400 })
      }

      const updated = await prisma.productionOrder.update({
        where: { id },
        data: { pesoTotalProduzido }
      })

      return NextResponse.json({ ok: true, order: updated })
    }

    // Ação: Finalizar ordem (enviar para conferência)
    if (action === 'FINALIZAR') {
      const { pesoTotalProduzido, totalPacotes, totalUnidades } = data

      if (!pesoTotalProduzido || !totalPacotes || !totalUnidades) {
        return NextResponse.json({ ok: false, error: 'Peso, pacotes e unidades são obrigatórios' }, { status: 400 })
      }

      // Fechar bobina ativa
      await prisma.productionBobina.updateMany({
        where: { orderId: id, fimAt: null },
        data: { fimAt: new Date() }
      })

      // Fechar sessão ativa
      await prisma.productionSession.updateMany({
        where: { orderId: id, fimAt: null },
        data: { fimAt: new Date() }
      })

      // Atualizar ordem
      const updated = await prisma.productionOrder.update({
        where: { id },
        data: {
          pesoTotalProduzido,
          totalPacotes,
          totalUnidades,
          status: 'AGUARDANDO_CONF',
          finishedAt: new Date()
        }
      })

      // Liberar máquina
      const lastSession = await prisma.productionSession.findFirst({
        where: { orderId: id },
        orderBy: { createdAt: 'desc' }
      })
      if (lastSession) {
        await prisma.machine.update({
          where: { id: lastSession.machineId },
          data: { currentOrderId: null }
        })
      }

      return NextResponse.json({ ok: true, order: updated })
    }

    // Ação: Trocar máquina
    if (action === 'TROCAR_MAQUINA') {
      const { newMachineId, operatorId, operatorName, turno } = data

      if (!newMachineId || !operatorId || !operatorName) {
        return NextResponse.json({ ok: false, error: 'Dados incompletos' }, { status: 400 })
      }

      // Fechar sessão atual
      await prisma.productionSession.updateMany({
        where: { orderId: id, fimAt: null },
        data: { fimAt: new Date() }
      })

      // Liberar máquina antiga
      const lastSession = await prisma.productionSession.findFirst({
        where: { orderId: id },
        orderBy: { createdAt: 'desc' }
      })
      if (lastSession) {
        await prisma.machine.update({
          where: { id: lastSession.machineId },
          data: { currentOrderId: null }
        })
      }

      // Criar nova sessão
      await prisma.productionSession.create({
        data: {
          orderId: id,
          operatorId,
          operatorName,
          machineId: newMachineId,
          turno: turno || order.turnoInicial
        }
      })

      // Atualizar nova máquina
      await prisma.machine.update({
        where: { id: newMachineId },
        data: { currentOrderId: id }
      })

      const updated = await prisma.productionOrder.findUnique({
        where: { id },
        include: { sessoes: { orderBy: { createdAt: 'desc' } } }
      })

      return NextResponse.json({ ok: true, order: updated })
    }

    return NextResponse.json({ ok: false, error: 'Ação não reconhecida' }, { status: 400 })
  } catch (error) {
    console.error('Erro ao atualizar ordem:', error)
    return NextResponse.json({ ok: false, error: 'Erro ao atualizar ordem' }, { status: 500 })
  }
}
