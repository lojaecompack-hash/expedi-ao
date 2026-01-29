import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// GET - Verificar novas ocorrências para o usuário logado
// Lógica:
// - Usuário comum: vê apenas mensagens onde destinatarioId = seu ID
// - Gerente (isManager=true): vê TODAS mensagens onde destinatarioTipo = seu role (setor)
export async function GET() {
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

    // Construir condição de filtro baseado no tipo de usuário
    // Se gerente: vê todas do setor (destinatarioTipo = seu role)
    // Se usuário comum: vê apenas as direcionadas a ele (destinatarioId = seu id)
    const isManager = (dbUser as { isManager?: boolean }).isManager === true
    const userRole = dbUser.role // VENDAS, FINANCEIRO, EXPEDICAO, etc.

    // Query SIMPLIFICADA - buscar todas PENDENTE destinadas ao usuário
    // e filtrar no código para excluir as que ele mesmo enviou
    const whereCondition = {
      statusOcorrencia: 'PENDENTE' as const,
      OR: [
        { destinatarioId: dbUser.id },
        { destinatarioTipo: isManager ? userRole : undefined },
        { setorDestino: dbUser.name }
      ].filter(c => Object.values(c)[0] !== undefined)
    }

    // Log para debug
    console.log('[API /api/ocorrencias/novas] Usuario:', dbUser.name, '| ID:', dbUser.id, '| Role:', userRole, '| isManager:', isManager)
    console.log('[API /api/ocorrencias/novas] Query:', JSON.stringify(whereCondition))

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

    // Filtrar no código: excluir mensagens que o próprio usuário enviou
    const ocorrenciasFiltradas = novasOcorrencias.filter(o => {
      // Se remetenteId é null (sistema) ou diferente do usuário logado, mostrar
      return o.remetenteId === null || o.remetenteId !== dbUser.id
    })

    console.log('[API /api/ocorrencias/novas] Total encontradas:', novasOcorrencias.length, '| Após filtro remetente:', ocorrenciasFiltradas.length)

    // Formatar resposta
    const ocorrenciasFormatadas = ocorrenciasFiltradas.map(o => ({
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
