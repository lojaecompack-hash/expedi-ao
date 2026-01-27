import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// GET - Verificar novas ocorrências para o setor do usuário logado
export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 })
    }

    // Buscar usuário no banco para obter o nome do setor
    const dbUser = await prisma.user.findUnique({
      where: { email: authUser.email! }
    })

    if (!dbUser) {
      return NextResponse.json({ ok: false, error: 'Usuário não encontrado' }, { status: 404 })
    }

    const setorUsuario = dbUser.name // Nome do usuário é o setor (Expedição, Vendas, Financeiro)

    // Buscar parâmetro de última verificação
    const { searchParams } = new URL(request.url)
    const ultimaVerificacao = searchParams.get('desde')

    // Buscar ocorrências pendentes para este setor
    const whereClause: Record<string, unknown> = {
      setorDestino: setorUsuario,
      statusOcorrencia: 'PENDENTE'
    }

    // Se tiver data de última verificação, buscar apenas as mais recentes
    if (ultimaVerificacao) {
      whereClause.createdAt = {
        gt: new Date(ultimaVerificacao)
      }
    }

    const novasOcorrencias = await prisma.ocorrencia.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        linhaTempo: {
          include: {
            pickup: {
              include: {
                order: {
                  select: {
                    orderNumber: true
                  }
                }
              }
            }
          }
        }
      }
    })

    // Formatar resposta
    const ocorrenciasFormatadas = novasOcorrencias.map(o => ({
      id: o.id,
      descricao: o.descricao,
      operadorNome: o.operadorNome,
      setorOrigem: o.setorOrigem,
      setorDestino: o.setorDestino,
      createdAt: o.createdAt,
      pedidoNumero: o.linhaTempo?.pickup?.order?.orderNumber || 'N/A',
      pickupId: o.linhaTempo?.pickup?.id
    }))

    return NextResponse.json({
      ok: true,
      setor: setorUsuario,
      ocorrencias: ocorrenciasFormatadas,
      total: ocorrenciasFormatadas.length
    })

  } catch (error) {
    console.error('[API /api/ocorrencias/novas] Erro:', error)
    return NextResponse.json({
      ok: false,
      error: 'Erro ao buscar ocorrências'
    }, { status: 500 })
  }
}
