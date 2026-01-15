import { prisma } from './prisma'
import { decrypt } from './crypto'

interface TinyApiResponse<T = unknown> {
  retorno: {
    status_processamento: string
    status: string
    codigo_erro?: string
    erros?: Array<{ erro: string }>
    pedido?: T
    pedidos?: T[]
  }
}

export async function getTinyApiToken(): Promise<string> {
  const workspace = await prisma.workspace.findFirst({
    where: { name: 'Default' },
    include: { tinySettings: true }
  })

  if (!workspace?.tinySettings) {
    throw new Error('Tiny ERP não configurado. Configure em /settings/integrations/tiny')
  }

  return decrypt(workspace.tinySettings.apiTokenEncrypted)
}

interface TinyPedido {
  id: string
  numero: string
  [key: string]: unknown
}

export async function getTinyOrder(orderNumber: string): Promise<TinyPedido | undefined> {
  const token = await getTinyApiToken()
  
  console.log('[Tiny API] Buscando pedido:', orderNumber)
  console.log('[Tiny API] Token (primeiros 20 chars):', token.substring(0, 20) + '...')
  
  // Buscar lista de pedidos
  const url = 'https://api.tiny.com.br/api2/pedidos.pesquisa.php'
  const params = new URLSearchParams({
    token,
    formato: 'JSON'
  })

  console.log('[Tiny API] Listando pedidos...')

  const response = await fetch(`${url}?${params.toString()}`)
  
  console.log('[Tiny API] Response status:', response.status)
  
  if (!response.ok) {
    throw new Error(`Erro ao buscar pedidos: ${response.status}`)
  }

  const data = await response.json() as TinyApiResponse<TinyPedido>
  
  console.log('[Tiny API] Total de pedidos:', data.retorno.pedidos?.length || 0)
  
  // status_processamento = "3" significa SUCESSO na API do Tiny
  // status = "Erro" indica erro
  if (data.retorno.status === 'Erro') {
    const erro = data.retorno.erros?.[0]?.erro || data.retorno.codigo_erro || 'Erro desconhecido'
    console.error('[Tiny API] Erro do Tiny:', erro)
    throw new Error(`Erro Tiny: ${erro}`)
  }

  // Buscar pedido pelo número na lista
  const pedidos = (data.retorno.pedidos || []) as unknown as Array<{ pedido: TinyPedido }>
  
  console.log('[Tiny API] Procurando pedido número:', orderNumber)
  console.log('[Tiny API] Números disponíveis:', pedidos.map(p => p.pedido?.numero).join(', '))
  
  const pedidoItem = pedidos.find(item => {
    const numero = String(item.pedido?.numero || '')
    const match = numero === orderNumber
    console.log(`[Tiny API] Comparando "${numero}" === "${orderNumber}": ${match}`)
    return match
  })
  
  if (!pedidoItem || !pedidoItem.pedido) {
    console.error('[Tiny API] Pedido não encontrado na lista')
    console.error('[Tiny API] Pedidos disponíveis:', pedidos.map(p => ({ id: p.pedido?.id, numero: p.pedido?.numero })))
    throw new Error(`Pedido número ${orderNumber} não encontrado`)
  }
  
  const pedido = pedidoItem.pedido
  console.log('[Tiny API] Pedido encontrado:', { id: pedido.id, numero: pedido.numero })
  
  return pedido
}

export async function markOrderAsShipped(orderNumber: string, orderId?: string) {
  const token = await getTinyApiToken()
  
  // Se não tiver o ID, buscar o pedido primeiro
  let pedidoId = orderId
  if (!pedidoId) {
    console.log('[Tiny API] Buscando ID do pedido:', orderNumber)
    const pedido = await getTinyOrder(orderNumber)
    
    if (!pedido || !pedido.id) {
      throw new Error('Pedido não encontrado para marcar como enviado')
    }
    
    pedidoId = String(pedido.id)
  }
  
  console.log('[Tiny API] Alterando situação do pedido ID:', pedidoId)
  
  const url = 'https://api.tiny.com.br/api2/pedido.alterar.situacao.php'
  const params = new URLSearchParams({
    token,
    id: pedidoId,
    situacao: 'enviado',
    formato: 'JSON'
  })

  const response = await fetch(`${url}?${params.toString()}`, {
    method: 'POST'
  })
  
  console.log('[Tiny API] Response status alterar situação:', response.status)
  
  if (!response.ok) {
    throw new Error(`Erro ao marcar pedido como enviado: ${response.status}`)
  }

  const data = await response.json() as TinyApiResponse
  
  console.log('[Tiny API] Resposta alterar situação:', JSON.stringify(data, null, 2))
  
  // status_processamento = "3" significa SUCESSO na API do Tiny
  // status = "Erro" indica erro
  if (data.retorno.status === 'Erro') {
    const erro = data.retorno.erros?.[0]?.erro || data.retorno.codigo_erro || 'Erro desconhecido'
    console.error('[Tiny API] Erro ao alterar status:', erro)
    console.error('[Tiny API] Resposta completa:', data)
    throw new Error(`Erro Tiny: ${erro}`)
  }

  console.log('[Tiny API] Situação alterada com sucesso!')
  return data.retorno
}
