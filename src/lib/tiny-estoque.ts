import { getTinyApiToken } from './tiny-api'

interface TinyProduto {
  id: string
  codigo: string
  nome: string
  unidade: string
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
 */
async function buscarProdutoPorSku(sku: string): Promise<TinyProduto | null> {
  try {
    const token = await getTinyApiToken()
    
    const url = 'https://api.tiny.com.br/api2/produtos.pesquisa.php'
    const params = new URLSearchParams({
      token,
      pesquisa: sku,
      formato: 'json'
    })

    console.log('[Tiny Estoque v2] Buscando produto por SKU:', sku)

    const response = await fetch(`${url}?${params}`)
    const data = await response.json()

    if (data.retorno?.status === 'OK' && data.retorno?.produtos) {
      const produtos = data.retorno.produtos as Array<{ produto: TinyProduto }>
      const produtoExato = produtos.find(p => p.produto.codigo === sku)
      
      if (produtoExato) {
        console.log('[Tiny Estoque v2] Produto encontrado:', produtoExato.produto)
        return produtoExato.produto
      }
      
      if (produtos.length > 0) {
        console.log('[Tiny Estoque v2] Usando primeiro resultado:', produtos[0].produto)
        return produtos[0].produto
      }
    }

    console.log('[Tiny Estoque v2] Produto nao encontrado para SKU:', sku)
    return null
  } catch (error) {
    console.error('[Tiny Estoque v2] Erro ao buscar produto:', error)
    return null
  }
}

/**
 * Atualiza o estoque de um produto na Tiny
 * IMPORTANTE: XML sem indentação para evitar erro "JSON mal formado"
 */
export async function atualizarEstoqueTinyV2(
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

    const produto = await buscarProdutoPorSku(sku)
    
    if (!produto) {
      result.error = `Produto nao encontrado na Tiny: ${sku}`
      return result
    }

    result.produtoId = produto.id
    result.produtoNome = produto.nome

    console.log('[Tiny Estoque v2] Atualizando estoque:', {
      produtoId: produto.id,
      produtoNome: produto.nome,
      quantidade,
      tipo: tipo === 'E' ? 'Entrada' : 'Saida'
    })

    // XML SEM INDENTAÇÃO - usar codigo ao invés de idProduto
    const obsEscaped = observacoes.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const estoqueXml = `<estoque><codigo>${produto.codigo}</codigo><tipo>${tipo}</tipo><quantidade>${quantidade}</quantidade><observacoes>${obsEscaped}</observacoes></estoque>`

    const url = 'https://api.tiny.com.br/api2/produto.atualizar.estoque.php'
    
    const formData = new URLSearchParams()
    formData.append('token', token)
    formData.append('formato', 'json')
    formData.append('estoque', estoqueXml)

    console.log('[Tiny Estoque v2] XML enviado (SEM indentacao):', estoqueXml)

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    })

    const data = await response.json()
    result.data = data

    console.log('[Tiny Estoque v2] Resposta:', JSON.stringify(data, null, 2))

    if (data.retorno?.status === 'Erro') {
      result.error = data.retorno.erros?.[0]?.erro || 'Erro desconhecido da Tiny'
      console.error('[Tiny Estoque v2] Erro:', result.error)
    } else {
      result.success = true
      console.log('[Tiny Estoque v2] Estoque atualizado com sucesso!')
    }

    return result
  } catch (error) {
    console.error('[Tiny Estoque v2] Excecao:', error)
    result.error = error instanceof Error ? error.message : String(error)
    return result
  }
}

/**
 * Dá entrada no estoque (aumenta quantidade)
 */
export async function entradaEstoqueTinyV2(
  sku: string,
  quantidade: number,
  observacoes: string
): Promise<TinyEstoqueResult> {
  return atualizarEstoqueTinyV2(sku, quantidade, 'E', observacoes)
}

/**
 * Dá saída no estoque (diminui quantidade)
 */
export async function saidaEstoqueTinyV2(
  sku: string,
  quantidade: number,
  observacoes: string
): Promise<TinyEstoqueResult> {
  return atualizarEstoqueTinyV2(sku, quantidade, 'S', observacoes)
}
