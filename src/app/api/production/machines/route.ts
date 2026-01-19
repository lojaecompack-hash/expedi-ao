import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 })
    }

    const machines = await prisma.machine.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
      include: {
        sessoes: {
          where: { fimAt: null },
          take: 1,
          include: {
            order: {
              select: {
                id: true,
                code: true,
                productName: true,
                productMeasure: true,
                status: true,
                pesoTotalProduzido: true,
                bobinaPesoInicial: true,
                totalApara: true
              }
            }
          }
        },
        paradas: {
          where: { fimAt: null },
          take: 1
        }
      }
    })

    const machinesWithStatus = machines.map(machine => {
      const activeSession = machine.sessoes[0]
      const activeParada = machine.paradas[0]
      
      let status: 'LIVRE' | 'ATIVA' | 'PARADA' = 'LIVRE'
      if (activeParada) {
        status = 'PARADA'
      } else if (activeSession) {
        status = 'ATIVA'
      }

      return {
        id: machine.id,
        code: machine.code,
        name: machine.name,
        status,
        currentOrder: activeSession?.order || null,
        currentSession: activeSession ? {
          id: activeSession.id,
          operatorName: activeSession.operatorName,
          turno: activeSession.turno,
          inicioAt: activeSession.inicioAt
        } : null,
        currentParada: activeParada ? {
          id: activeParada.id,
          tipo: activeParada.tipo,
          motivo: activeParada.motivo,
          inicioAt: activeParada.inicioAt
        } : null
      }
    })

    return NextResponse.json({ ok: true, machines: machinesWithStatus })
  } catch (error) {
    console.error('Erro ao buscar máquinas:', error)
    return NextResponse.json({ ok: false, error: 'Erro ao buscar máquinas' }, { status: 500 })
  }
}
