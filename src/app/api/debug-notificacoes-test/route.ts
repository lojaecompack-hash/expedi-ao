import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Debug de notificações SEM autenticação - para testar
// REMOVER DEPOIS DE DEBUGAR
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userEmail = searchParams.get('email') || 'rodrigo@ecompack.com.br'
    
    // Buscar usuário pelo email
    const dbUser = await prisma.user.findUnique({
      where: { email: userEmail }
    })

    if (!dbUser) {
      return NextResponse.json({ ok: false, error: 'Usuário não encontrado', email: userEmail }, { status: 404 })
    }

    const isManager = (dbUser as { isManager?: boolean }).isManager === true
    const userRole = dbUser.role

    // Query SIMPLIFICADA
    const whereCondition = {
      statusOcorrencia: 'PENDENTE' as const,
      OR: [
        { destinatarioId: dbUser.id },
        ...(isManager ? [{ destinatarioTipo: userRole }] : []),
        { setorDestino: dbUser.name }
      ]
    }

    console.log('[DEBUG] Usuario:', dbUser.name, '| ID:', dbUser.id, '| Role:', userRole, '| isManager:', isManager)
    console.log('[DEBUG] Query:', JSON.stringify(whereCondition, null, 2))

    const novasOcorrencias = await prisma.ocorrencia.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        descricao: true,
        remetenteId: true,
        destinatarioId: true,
        destinatarioTipo: true,
        setorOrigem: true,
        setorDestino: true,
        statusOcorrencia: true,
        createdAt: true
      }
    })

    // Filtrar no código: excluir mensagens que o próprio usuário enviou
    const ocorrenciasFiltradas = novasOcorrencias.filter(o => {
      return o.remetenteId === null || o.remetenteId !== dbUser.id
    })

    return NextResponse.json({
      ok: true,
      debug: {
        usuario: dbUser.name,
        userId: dbUser.id,
        email: dbUser.email,
        role: userRole,
        isManager,
        queryUsada: whereCondition
      },
      totalEncontradas: novasOcorrencias.length,
      totalAposFiltro: ocorrenciasFiltradas.length,
      ocorrenciasAntesFiltro: novasOcorrencias,
      ocorrenciasAposFiltro: ocorrenciasFiltradas
    })

  } catch (error) {
    console.error('[DEBUG] Erro:', error)
    return NextResponse.json({
      ok: false,
      error: String(error)
    }, { status: 500 })
  }
}
