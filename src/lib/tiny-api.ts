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
  
  const url = 'https://api.tiny.com.br/api2/pedido.obter.php'
  const params = new URLSearchParams({
    token,
    numero: orderNumber,
    formato: 'JSON'
  })

  const response = await fetch(`${url}?${params.toString()}`)
  
  if (!response.ok) {
    throw new Error(`Erro ao buscar pedido: ${response.status}`)
  }

  const data = await response.json() as TinyApiResponse<TinyPedido>
  
  if (data.retorno.status_processamento === '3') {
    const erro = data.retorno.erros?.[0]?.erro || 'Erro desconhecido'
    throw new Error(`Erro Tiny: ${erro}`)
  }

  return data.retorno.pedido
}

export async function markOrderAsShipped(orderNumber: string) {
  const token = await getTinyApiToken()
  
  const url = 'https://api.tiny.com.br/api2/pedido.alterar.situacao.php'
  const params = new URLSearchParams({
    token,
    numero: orderNumber,
    situacao: 'faturado',
    formato: 'JSON'
  })

  const response = await fetch(`${url}?${params.toString()}`, {
    method: 'POST'
  })
  
  if (!response.ok) {
    throw new Error(`Erro ao marcar pedido como enviado: ${response.status}`)
  }

  const data = await response.json() as TinyApiResponse
  
  if (data.retorno.status_processamento === '3') {
    const erro = data.retorno.erros?.[0]?.erro || 'Erro desconhecido'
    throw new Error(`Erro Tiny: ${erro}`)
  }

  return data.retorno
}
