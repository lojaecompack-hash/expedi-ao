import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// GET - Verificar novas ocorrências para o usuário logado
// Lógica:
// - Usuário comum: vê apenas mensagens onde destinatarioId = seu ID
// - Gerente (isManager=true): vê TODAS mensagens onde destinatarioTipo = seu role (setor)
export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 })
    }

    // Buscar usuário no banco com todas as informações necessárias
    const dbUser = await prisma.user.findUnique({
      where: { email: authUser.email! }
    })

    if (!dbUser) {
      return NextResponse.json({ ok: false, error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Buscar parâmetro de última verificação
    const { searchParams } = new URL(request.url)
    const ultimaVerificacao = searchParams.get('desde')

    // Construir condição de filtro baseado no tipo de usuário
    // Se gerente: vê todas do setor (destinatarioTipo = seu role)
    // Se usuário comum: vê apenas as direcionadas a ele (destinatarioId = seu id)
    const isManager = (dbUser as { isManager?: boolean }).isManager === true
    const userRole = dbUser.role // VENDAS, FINANCEIRO, EXPEDICAO, etc.

    let whereCondition: Record<string, unknown>

    if (isManager) {
      // Gerente vê todas do seu setor OU direcionadas especificamente a ele
      whereCondition = {
        AND: [
          {
            OR: [
              { destinatarioTipo: userRole },
              { destinatarioId: dbUser.id },
              { setorDestino: dbUser.name } // Compatibilidade com mensagens antigas
            ]
          },
          { statusOcorrencia: 'PENDENTE' },
          {
            OR: [
              { remetenteId: { not: dbUser.id } },
              { remetenteId: null } // Incluir mensagens do sistema
            ]
          }
        ]
      }
    } else {
      // Usuário comum vê apenas mensagens direcionadas a ele
      whereCondition = {
        AND: [
          {
            OR: [
              { destinatarioId: dbUser.id },
              { setorDestino: dbUser.name } // Compatibilidade com mensagens antigas
            ]
          },
          { statusOcorrencia: 'PENDENTE' },
          {
            OR: [
              { remetenteId: { not: dbUser.id } },
              { remetenteId: null } // Incluir mensagens do sistema
            ]
          }
        ]
      }
    }

    // Se tiver data de última verificação, adicionar ao AND
    if (ultimaVerificacao) {
      (whereCondition.AND as Array<Record<string, unknown>>).push({
        createdAt: { gt: new Date(ultimaVerificacao) }
      })
    }

    const novasOcorrencias = await prisma.ocorrencia.findMany({
      where: whereCondition,
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
      usuario: dbUser.name,
      isManager,
      role: userRole,
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
