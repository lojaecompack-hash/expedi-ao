import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// Atualizar rastreio de uma retirada
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { trackingCode } = body
    
    console.log('[Retirada PATCH API] Atualizando rastreio:', { id, trackingCode })
    
    // Verificar se retirada existe
    const existingPickup = await prisma.pickup.findUnique({
      where: { id }
    })
    
    if (!existingPickup) {
      return NextResponse.json(
        { ok: false, error: 'Retirada não encontrada' },
        { status: 404 }
      )
    }
    
    // Preparar dados para atualização
    // Se já existe um rastreio e estamos mudando, salvar o anterior
    const updateData: {
      trackingCode: string | null
      previousTrackingCode?: string | null
      trackingUpdatedAt?: Date
    } = {
      trackingCode: trackingCode || null
    }
    
    // Se tinha rastreio anterior e o novo é diferente, salvar histórico
    if (existingPickup.trackingCode && existingPickup.trackingCode !== trackingCode) {
      updateData.previousTrackingCode = existingPickup.trackingCode
      updateData.trackingUpdatedAt = new Date()
      console.log('[Retirada PATCH API] Salvando rastreio anterior:', existingPickup.trackingCode)
    }
    
    // Atualizar o pickup
    const updatedPickup = await prisma.pickup.update({
      where: { id },
      data: updateData
    })
    
    console.log('[Retirada PATCH API] Rastreio atualizado:', updatedPickup.id)
    
    return NextResponse.json({
      ok: true,
      message: 'Rastreio atualizado com sucesso',
      pickup: updatedPickup
    }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[Retirada PATCH API] Erro:', message)
    
    return NextResponse.json(
      { ok: false, error: 'Erro ao atualizar rastreio', details: message },
      { status: 500 }
    )
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    console.log('[Retirada Detalhes API] Buscando retirada ID:', id)
    
    // Buscar retirada atual com todos os dados
    const retirada = await prisma.pickup.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            id: true,
            tinyOrderId: true,
            orderNumber: true,
            statusTiny: true,
            statusInterno: true,
            createdAt: true,
            updatedAt: true,
          }
        },
        linhasDoTempo: {
          include: {
            ocorrencias: {
              orderBy: { createdAt: 'asc' }
            }
          },
          orderBy: { numero: 'asc' }
        }
      }
    })
    
    if (!retirada) {
      return NextResponse.json(
        { ok: false, error: 'Retirada não encontrada' },
        { status: 404 }
      )
    }
    
    // Buscar TODAS as retiradas do mesmo pedido (histórico completo)
    const todasRetiradas = await prisma.pickup.findMany({
      where: { orderId: retirada.orderId },
      include: {
        linhasDoTempo: {
          include: {
            ocorrencias: {
              orderBy: { createdAt: 'asc' }
            }
          },
          orderBy: { numero: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' } // Mais recente primeiro
    })
    
    console.log('[Retirada Detalhes API] Retirada encontrada:', retirada.id, '| Total retiradas do pedido:', todasRetiradas.length)
    
    // Se não tiver itens salvos, buscar da API Tiny
    let retiradaComItens = retirada
    if (!retirada.itens && retirada.order.tinyOrderId) {
      try {
        console.log('[Retirada Detalhes API] Buscando itens da Tiny para pedido:', retirada.order.tinyOrderId)
        
        // Buscar token da Tiny
        const tinySettings = await prisma.tinySettings.findFirst({
          where: { isActive: true }
        })
        
        if (tinySettings) {
          const tinyRes = await fetch(
            `https://api.tiny.com.br/api2/pedido.obter.php?token=${tinySettings.apiTokenEncrypted}&id=${retirada.order.tinyOrderId}&formato=json`
          )
          const tinyData = await tinyRes.json()
          
          console.log('[Retirada Detalhes API] Resposta Tiny:', JSON.stringify(tinyData.retorno?.status), 'Itens:', tinyData.retorno?.pedido?.itens?.length)
          
          if (tinyData.retorno?.status === 'OK' && tinyData.retorno?.pedido?.itens) {
            const itensFormatados = tinyData.retorno.pedido.itens.map((item: { item: { id?: string, id_produto?: string, codigo?: string, descricao?: string, quantidade?: string | number } }) => ({
              id: item.item.id_produto || item.item.id || item.item.codigo || '',
              descricao: item.item.descricao || 'Produto sem descrição',
              quantidade: typeof item.item.quantidade === 'string' ? parseFloat(item.item.quantidade) : (item.item.quantidade || 1)
            }))
            
            // Adicionar itens ao objeto de retorno (sem salvar no banco)
            retiradaComItens = {
              ...retirada,
              itens: JSON.stringify(itensFormatados)
            }
            
            console.log('[Retirada Detalhes API] Itens obtidos da Tiny:', itensFormatados.length)
          }
        }
      } catch (tinyError) {
        console.error('[Retirada Detalhes API] Erro ao buscar itens da Tiny:', tinyError)
        // Continua sem itens se falhar
      }
    }
    
    return NextResponse.json({
      ok: true,
      retirada: retiradaComItens,
      historicoRetiradas: todasRetiradas // Array com todas as retiradas do pedido
    }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[Retirada Detalhes API] Erro:', message)
    
    return NextResponse.json(
      { ok: false, error: 'Erro ao buscar detalhes da retirada', details: message },
      { status: 500 }
    )
  }
}

// DELETE - Excluir uma retirada (apenas ADMIN)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 })
    }

    // Verificar se é ADMIN
    const dbUser = await prisma.user.findUnique({
      where: { email: authUser.email! }
    })

    if (!dbUser || dbUser.role !== 'ADMIN') {
      return NextResponse.json({ ok: false, error: 'Sem permissão. Apenas administradores podem excluir retiradas.' }, { status: 403 })
    }

    const { id } = await params
    
    console.log('[Retirada DELETE API] Admin', dbUser.email, 'excluindo retirada:', id)
    
    // Verificar se retirada existe
    const existingPickup = await prisma.pickup.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            orderNumber: true
          }
        }
      }
    })
    
    if (!existingPickup) {
      return NextResponse.json(
        { ok: false, error: 'Retirada não encontrada' },
        { status: 404 }
      )
    }
    
    // Deletar retirada (cascade deleta linhas do tempo e ocorrências)
    await prisma.pickup.delete({
      where: { id }
    })
    
    console.log('[Retirada DELETE API] Retirada excluída com sucesso:', id, 'Pedido:', existingPickup.order.orderNumber)
    
    return NextResponse.json({
      ok: true,
      message: 'Retirada excluída com sucesso'
    }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[Retirada DELETE API] Erro:', message)
    
    return NextResponse.json(
      { ok: false, error: 'Erro ao excluir retirada', details: message },
      { status: 500 }
    )
  }
}
