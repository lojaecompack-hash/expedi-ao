import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// GET - Verificar novas ocorrências para o usuário logado
// Lógica:
// - Usuário comum: vê apenas mensagens onde destinatarioId = seu ID
// - Gerente (isManager=true): vê TODAS mensagens onde destinatarioTipo = seu role (setor)
export async function GET() {
  try {
    console.log('[API /api/ocorrencias/novas] Iniciando...')
    
    let supabase
    try {
      supabase = await createSupabaseServerClient()
      console.log('[API /api/ocorrencias/novas] Supabase client criado')
    } catch (supabaseError) {
      console.error('[API /api/ocorrencias/novas] Erro ao criar Supabase client:', supabaseError)
      return NextResponse.json({ ok: false, error: 'Erro Supabase', details: String(supabaseError) }, { status: 500 })
    }
    
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('[API /api/ocorrencias/novas] Erro auth:', authError)
      return NextResponse.json({ ok: false, error: 'Erro auth', details: authError.message }, { status: 500 })
    }

    if (!authUser) {
      console.log('[API /api/ocorrencias/novas] Usuario nao autenticado')
      return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 })
    }
    
    console.log('[API /api/ocorrencias/novas] Usuario autenticado:', authUser.email)

    // Buscar usuário no banco com todas as informações necessárias
    const dbUser = await prisma.user.findUnique({
      where: { email: authUser.email! }
    })
    
    console.log('[API /api/ocorrencias/novas] dbUser encontrado:', dbUser?.name)

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

    // Query simples sem relações aninhadas para evitar erro com linhaTempo null
    const novasOcorrencias = await prisma.ocorrencia.findMany({
      where: {
        ...whereCondition,
        linhaTempoId: { not: null } // Apenas ocorrências com linhaTempo
      },
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
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json({
      ok: false,
      error: 'Erro ao buscar ocorrências',
      details: errorMessage
    }, { status: 500 })
  }
}
