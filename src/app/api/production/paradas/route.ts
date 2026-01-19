import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// POST - Registrar parada
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { machineId, tipo, motivo, operatorId, operatorName, turno } = body

    if (!machineId || !tipo || !turno) {
      return NextResponse.json({ ok: false, error: 'Dados incompletos' }, { status: 400 })
    }

    // Verificar se máquina existe
    const machine = await prisma.machine.findUnique({ where: { id: machineId } })
    if (!machine) {
      return NextResponse.json({ ok: false, error: 'Máquina não encontrada' }, { status: 404 })
    }

    // Verificar se já existe parada ativa
    const paradaAtiva = await prisma.machineParada.findFirst({
      where: { machineId, fimAt: null }
    })
    if (paradaAtiva) {
      return NextResponse.json({ ok: false, error: 'Já existe uma parada ativa para esta máquina' }, { status: 400 })
    }

    // Criar parada
    const parada = await prisma.machineParada.create({
      data: {
        machineId,
        tipo,
        motivo,
        operatorId,
        operatorName,
        turno
      }
    })

    return NextResponse.json({ ok: true, parada })
  } catch (error) {
    console.error('Erro ao registrar parada:', error)
    return NextResponse.json({ ok: false, error: 'Erro ao registrar parada' }, { status: 500 })
  }
}

// PUT - Encerrar parada
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { paradaId } = body

    if (!paradaId) {
      return NextResponse.json({ ok: false, error: 'ID da parada é obrigatório' }, { status: 400 })
    }

    const parada = await prisma.machineParada.findUnique({ where: { id: paradaId } })
    if (!parada) {
      return NextResponse.json({ ok: false, error: 'Parada não encontrada' }, { status: 404 })
    }
    if (parada.fimAt) {
      return NextResponse.json({ ok: false, error: 'Parada já foi encerrada' }, { status: 400 })
    }

    // Calcular duração em minutos
    const inicio = new Date(parada.inicioAt)
    const fim = new Date()
    const duracaoMin = Math.round((fim.getTime() - inicio.getTime()) / 60000)

    // Atualizar parada
    const paradaAtualizada = await prisma.machineParada.update({
      where: { id: paradaId },
      data: {
        fimAt: fim,
        duracaoMin
      }
    })

    return NextResponse.json({ ok: true, parada: paradaAtualizada })
  } catch (error) {
    console.error('Erro ao encerrar parada:', error)
    return NextResponse.json({ ok: false, error: 'Erro ao encerrar parada' }, { status: 500 })
  }
}
