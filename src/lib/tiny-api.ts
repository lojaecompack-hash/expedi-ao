import { prisma } from './prisma'
import { decrypt } from './crypto'
import { IS_DEV, getTinyTestToken, ENV } from './env'

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
  console.log(`[Tiny API] Ambiente: ${ENV.toUpperCase()}`)

  // Se for ambiente de desenvolvimento, usar token de teste
  if (IS_DEV) {
    const testToken = getTinyTestToken()
    if (testToken) {
      console.log('[Tiny API] Usando TOKEN DE TESTE (desenvolvimento)')
      return testToken
    }
    console.warn('[Tiny API] Token de teste não configurado, usando banco')
  }

  // Token do banco de dados (produção ou fallback)
  const workspace = await prisma.workspace.findFirst({
    where: { name: 'Default' },
    include: { tinySettings: true }
  })

  if (!workspace?.tinySettings) {
    throw new Error('Tiny ERP não configurado. Configure em /settings/integrations/tiny')
  }

  console.log('[Tiny API] Usando TOKEN DO BANCO (produção)')
  return decrypt(workspace.tinySettings.apiTokenEncrypted)
}

interface TinyPedido {
  id: string
  numero: string
  cliente?: {
    nome?: string
    cpf_cnpj?: string
  }
  itens?: Array<{
    item: {
      id?: string
      codigo?: string
      descricao?: string
      unidade?: string
      quantidade?: string
    }
  }>
  [key: string]: unknown
}

export async function getTinyOrder(orderNumber: string): Promise<TinyPedido | undefined> {
  const token = await getTinyApiToken()
  
  console.log('[Tiny API] ========================================')
  console.log('[Tiny API] Buscando pedido:', orderNumber)
  console.log('[Tiny API] Token length:', token.length)
  console.log('[Tiny API] Token (primeiros 20 chars):', token.substring(0, 20) + '...')
  
  // Buscar lista de pedidos com filtro de número
  const url = 'https://api.tiny.com.br/api2/pedidos.pesquisa.php'
  const params = new URLSearchParams({
    token,
    formato: 'JSON',
    numero: orderNumber // Adicionar filtro de número
  })

  console.log('[Tiny API] URL:', url)
  console.log('[Tiny API] Params:', params.toString().replace(token, 'TOKEN_HIDDEN'))

  const response = await fetch(`${url}?${params.toString()}`)
  
  console.log('[Tiny API] Response status:', response.status)
  console.log('[Tiny API] Response ok:', response.ok)
  
  if (!response.ok) {
    const errorText = await response.text()
    console.error('[Tiny API] Response error text:', errorText)
    throw new Error(`Erro ao buscar pedidos: ${response.status}`)
  }

  const data = await response.json() as TinyApiResponse<TinyPedido>
  
  console.log('[Tiny API] Response data:', JSON.stringify(data, null, 2))
  console.log('[Tiny API] Status processamento:', data.retorno.status_processamento)
  console.log('[Tiny API] Status:', data.retorno.status)
  console.log('[Tiny API] Total de pedidos:', data.retorno.pedidos?.length || 0)
  
  // status_processamento = "3" significa SUCESSO na API do Tiny
  // status = "Erro" indica erro
  if (data.retorno.status === 'Erro') {
    const erro = data.retorno.erros?.[0]?.erro || data.retorno.codigo_erro || 'Erro desconhecido'
    console.error('[Tiny API] Erro do Tiny:', erro)
    console.error('[Tiny API] Código erro:', data.retorno.codigo_erro)
    console.error('[Tiny API] Erros completos:', JSON.stringify(data.retorno.erros))
    throw new Error(`Erro Tiny: ${erro}`)
  }

  // Buscar pedido pelo número na lista
  const pedidos = (data.retorno.pedidos || []) as unknown as Array<{ pedido: TinyPedido }>
  
  console.log('[Tiny API] Procurando pedido número:', orderNumber)
  console.log('[Tiny API] Números disponíveis:', pedidos.map(p => p.pedido?.numero).join(', '))
  console.log('[Tiny API] Pedidos completos:', JSON.stringify(pedidos.slice(0, 3), null, 2))
  
  const pedidoItem = pedidos.find(item => {
    const numero = String(item.pedido?.numero || '')
    const match = numero === orderNumber
    console.log(`[Tiny API] Comparando "${numero}" === "${orderNumber}": ${match}`)
    return match
  })
  
  if (!pedidoItem || !pedidoItem.pedido) {
    console.error('[Tiny API] ❌ Pedido não encontrado na lista')
    console.error('[Tiny API] Pedidos disponíveis:', pedidos.map(p => ({ id: p.pedido?.id, numero: p.pedido?.numero })))
    throw new Error(`Pedido número ${orderNumber} não encontrado`)
  }
  
  const pedido = pedidoItem.pedido
  console.log('[Tiny API] ✅ Pedido encontrado:', { id: pedido.id, numero: pedido.numero })
  console.log('[Tiny API] ========================================')
  
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

export interface TinyOrderDetails {
  id: string
  numero: string
  clienteNome: string
  itens: Array<{
    id: string
    descricao: string
    quantidade: number
  }>
}

// ==========================================
// GESTÃO DE ESTOQUE TINY
// ==========================================

interface TinyProduto {
  id: string
  codigo: string
  nome: string
  unidade: string
  preco: string
}

interface TinyEstoqueResult {
  success: boolean
  error: string | null
  data: unknown
  produtoId?: string
  produtoNome?: string
}

/**
 * Busca um produto na Tiny pelo código (SKU)
 * Retorna o ID numérico do produto necessário para operações de estoque
 */
export async function getTinyProductBySku(sku: string): Promise<TinyProduto | null> {
  try {
    const token = await getTinyApiToken()
    
    const url = 'https://api.tiny.com.br/api2/produtos.pesquisa.php'
    const params = new URLSearchParams({
      token,
      pesquisa: sku,
      formato: 'json'
    })

    console.log('[Tiny Estoque] Buscando produto por SKU:', sku)

    const response = await fetch(`${url}?${params}`)
    const data = await response.json()

    console.log('[Tiny Estoque] Resposta busca produto:', JSON.stringify(data, null, 2))

    if (data.retorno?.status === 'OK' && data.retorno?.produtos) {
      // Procurar produto com código exato
      const produtos = data.retorno.produtos as Array<{ produto: TinyProduto }>
      const produtoExato = produtos.find(p => p.produto.codigo === sku)
      
      if (produtoExato) {
        console.log('[Tiny Estoque] Produto encontrado:', produtoExato.produto)
        return produtoExato.produto
      }
      
      // Se não encontrou exato, retorna o primeiro resultado
      if (produtos.length > 0) {
        console.log('[Tiny Estoque] Usando primeiro resultado:', produtos[0].produto)
        return produtos[0].produto
      }
    }

    console.log('[Tiny Estoque] Produto nao encontrado para SKU:', sku)
    return null
  } catch (error) {
    console.error('[Tiny Estoque] Erro ao buscar produto:', error)
    return null
  }
}

/**
 * Atualiza o estoque de um produto na Tiny
 * @param sku Código do produto (SKU)
 * @param quantidade Quantidade a movimentar
 * @param tipo 'E' para entrada, 'S' para saída
 * @param observacoes Observações da movimentação
 */
export async function atualizarEstoqueTiny(
  sku: string,
  quantidade: number,
  tipo: 'E' | 'S',
  observacoes: string
): Promise<TinyEstoqueResult> {
  const result: TinyEstoqueResult = { success: false, error: null, data: null }

  try {
    const token = await getTinyApiToken()
    
    if (!token) {
      result.error = 'Token Tiny nao configurado'
      return result
    }

    // Primeiro, buscar o ID do produto pelo SKU
    const produto = await getTinyProductBySku(sku)
    
    if (!produto) {
      result.error = `Produto nao encontrado na Tiny: ${sku}`
      return result
    }

    result.produtoId = produto.id
    result.produtoNome = produto.nome

    console.log('[Tiny Estoque] Atualizando estoque:', {
      produtoId: produto.id,
      produtoNome: produto.nome,
      produtoUnidade: produto.unidade,
      quantidade,
      tipo: tipo === 'E' ? 'Entrada' : 'Saida',
      observacoes
    })

    // Usar formato XML conforme documentação da Tiny (sem indentação para evitar problemas)
    // Escapar caracteres especiais nas observações
    const obsEscaped = observacoes.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const estoqueXml = `<estoque><idProduto>${produto.id}</idProduto><tipo>${tipo}</tipo><quantidade>${quantidade}</quantidade><observacoes>${obsEscaped}</observacoes></estoque>`

    const url = 'https://api.tiny.com.br/api2/produto.atualizar.estoque.php'
    
    // Enviar como POST com body usando formato XML
    const formData = new URLSearchParams()
    formData.append('token', token)
    formData.append('formato', 'json')
    formData.append('estoque', estoqueXml)

    console.log('[Tiny Estoque] Enviando XML (sem indentacao):', estoqueXml)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    })

    const data = await response.json()
    result.data = data

    console.log('[Tiny Estoque] Resposta atualizacao:', JSON.stringify(data, null, 2))

    if (data.retorno?.status === 'Erro') {
      result.error = data.retorno.erros?.[0]?.erro || 'Erro desconhecido da Tiny'
      console.error('[Tiny Estoque] Erro:', result.error)
    } else {
      result.success = true
      console.log('[Tiny Estoque] Estoque atualizado com sucesso!')
    }

    return result
  } catch (error) {
    console.error('[Tiny Estoque] Excecao:', error)
    result.error = error instanceof Error ? error.message : String(error)
    return result
  }
}

/**
 * Dá entrada no estoque (aumenta quantidade)
 */
export async function entradaEstoqueTiny(
  sku: string,
  quantidade: number,
  observacoes: string
): Promise<TinyEstoqueResult> {
  return atualizarEstoqueTiny(sku, quantidade, 'E', observacoes)
}

/**
 * Dá saída no estoque (diminui quantidade)
 */
export async function saidaEstoqueTiny(
  sku: string,
  quantidade: number,
  observacoes: string
): Promise<TinyEstoqueResult> {
  return atualizarEstoqueTiny(sku, quantidade, 'S', observacoes)
}

// ==========================================
// GESTÃO DE PEDIDOS TINY
// ==========================================

export async function getTinyOrderDetails(orderNumber: string): Promise<TinyOrderDetails | null> {
  try {
    const token = await getTinyApiToken()
    
    // Primeiro buscar o ID do pedido
    const pedidoBasico = await getTinyOrder(orderNumber)
    if (!pedidoBasico || !pedidoBasico.id) {
      return null
    }
    
    // Buscar detalhes completos do pedido
    const url = 'https://api.tiny.com.br/api2/pedido.obter.php'
    const params = new URLSearchParams({
      token,
      id: String(pedidoBasico.id),
      formato: 'JSON'
    })
    
    console.log('[Tiny API] Buscando detalhes do pedido ID:', pedidoBasico.id)
    
    const response = await fetch(`${url}?${params.toString()}`)
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar detalhes: ${response.status}`)
    }
    
    const data = await response.json() as TinyApiResponse<TinyPedido>
    
    if (data.retorno.status === 'Erro') {
      const erro = data.retorno.erros?.[0]?.erro || 'Erro desconhecido'
      throw new Error(`Erro Tiny: ${erro}`)
    }
    
    const pedido = data.retorno.pedido
    if (!pedido) {
      return null
    }
    
    // Extrair dados necessários
    const detalhes: TinyOrderDetails = {
      id: String(pedido.id),
      numero: String(pedido.numero),
      clienteNome: pedido.cliente?.nome || 'Cliente não informado',
      itens: (pedido.itens || []).map((item, index) => ({
        id: item.item?.id || String(index),
        descricao: item.item?.descricao || 'Produto sem descrição',
        quantidade: parseFloat(item.item?.quantidade || '1')
      }))
    }
    
    console.log('[Tiny API] Detalhes do pedido:', detalhes)
    
    return detalhes
  } catch (error) {
    console.error('[Tiny API] Erro ao buscar detalhes:', error)
    return null
  }
}
