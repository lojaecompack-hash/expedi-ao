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
  
  const url = 'https://api.tiny.com.br/api2/pedido.obter.php'
  const params = new URLSearchParams({
    token,
    numero: orderNumber,
    formato: 'JSON'
  })

  console.log('[Tiny API] URL completa:', `${url}?${params.toString()}`)

  const response = await fetch(`${url}?${params.toString()}`)
  
  console.log('[Tiny API] Response status:', response.status)
  
  if (!response.ok) {
    throw new Error(`Erro ao buscar pedido: ${response.status}`)
  }

  const data = await response.json() as TinyApiResponse<TinyPedido>
  
  console.log('[Tiny API] Resposta completa:', JSON.stringify(data, null, 2))
  
  if (data.retorno.status_processamento === '3') {
    const erro = data.retorno.erros?.[0]?.erro || 'Erro desconhecido'
    console.error('[Tiny API] Erro do Tiny:', erro)
    throw new Error(`Erro Tiny: ${erro}`)
  }

  console.log('[Tiny API] Pedido encontrado:', data.retorno.pedido)
  return data.retorno.pedido
}

export async function markOrderAsShipped(orderNumber: string) {
  const token = await getTinyApiToken()
  
  // Primeiro buscar o pedido para pegar o ID
  console.log('[Tiny API] Buscando ID do pedido:', orderNumber)
  const pedido = await getTinyOrder(orderNumber)
  
  if (!pedido || !pedido.id) {
    throw new Error('Pedido não encontrado para marcar como enviado')
  }
  
  const pedidoId = String(pedido.id)
  console.log('[Tiny API] ID do pedido:', pedidoId)
  
  const url = 'https://api.tiny.com.br/api2/pedido.alterar.situacao.php'
  const params = new URLSearchParams({
    token,
    id: pedidoId,
    situacao: 'faturado',
    formato: 'JSON'
  })

  console.log('[Tiny API] Alterando situação do pedido...')

  const response = await fetch(`${url}?${params.toString()}`, {
    method: 'POST'
  })
  
  if (!response.ok) {
    throw new Error(`Erro ao marcar pedido como enviado: ${response.status}`)
  }

  const data = await response.json() as TinyApiResponse
  
  console.log('[Tiny API] Resposta alterar situação:', JSON.stringify(data, null, 2))
  
  if (data.retorno.status_processamento === '3') {
    const erro = data.retorno.erros?.[0]?.erro || 'Erro desconhecido'
    throw new Error(`Erro Tiny: ${erro}`)
  }

  console.log('[Tiny API] Situação alterada com sucesso!')
  return data.retorno
}
