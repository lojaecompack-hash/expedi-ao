import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Debug de notificações - verificar todas as ocorrências PENDENTE
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    // Buscar todas as ocorrências PENDENTE
    const todasPendentes = await prisma.ocorrencia.findMany({
      where: {
        statusOcorrencia: 'PENDENTE'
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        descricao: true,
        statusOcorrencia: true,
        remetenteId: true,
        destinatarioId: true,
        destinatarioTipo: true,
        setorOrigem: true,
        setorDestino: true,
        createdAt: true
      }
    })
    
    // Buscar todos os usuários para referência
    const usuarios = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isManager: true
      }
    })
    
    // Se userId fornecido, simular a query de notificação
    let simulacaoQuery = null
    if (userId) {
      const user = usuarios.find(u => u.id === userId)
      if (user) {
        // Simular query para esse usuário
        const isManager = user.isManager === true
        
        // Query simplificada para debug
        const notificacoesParaUsuario = await prisma.ocorrencia.findMany({
          where: {
            statusOcorrencia: 'PENDENTE',
            OR: [
              { destinatarioId: userId },
              { destinatarioTipo: user.role },
              { setorDestino: user.name }
            ]
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            descricao: true,
            remetenteId: true,
            destinatarioId: true,
            destinatarioTipo: true,
            createdAt: true
          }
        })
        
        // Filtrar manualmente para excluir as que o próprio usuário enviou
        const filtradas = notificacoesParaUsuario.filter(o => 
          o.remetenteId !== userId && o.remetenteId !== null || o.remetenteId === null
        )
        
        simulacaoQuery = {
          usuario: user,
          isManager,
          totalEncontradas: notificacoesParaUsuario.length,
          aposFiltragemRemetente: filtradas.length,
          ocorrencias: notificacoesParaUsuario,
          ocorrenciasFiltradas: filtradas
        }
      }
    }

    return NextResponse.json({
      ok: true,
      totalPendentes: todasPendentes.length,
      ocorrenciasPendentes: todasPendentes,
      usuarios: usuarios.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        isManager: u.isManager
      })),
      simulacaoQuery
    })

  } catch (error) {
    console.error('[Debug Notificações] Erro:', error)
    return NextResponse.json({
      ok: false,
      error: String(error)
    }, { status: 500 })
  }
}
