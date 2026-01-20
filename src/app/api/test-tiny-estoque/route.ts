import { NextRequest, NextResponse } from 'next/server'
import { getTinyApiToken } from '@/lib/tiny-api'

// GET - Testar atualização de estoque na Tiny diretamente
export async function GET(request: NextRequest) {
  const results: Record<string, unknown> = {}
  
  try {
    const { searchParams } = new URL(request.url)
    const sku = searchParams.get('sku') || '26x36-eco'
    const quantidade = searchParams.get('quantidade') || '1'
    const tipo = searchParams.get('tipo') || 'E'

    // 1. Obter token
    const token = await getTinyApiToken()
    results.token = token ? `OK: ${token.substring(0, 15)}...` : 'ERRO: Token não encontrado'

    if (!token) {
      return NextResponse.json({ ok: false, error: 'Token não encontrado', results })
    }

    // 2. Buscar produto pelo SKU
    const urlPesquisa = 'https://api.tiny.com.br/api2/produtos.pesquisa.php'
    const paramsPesquisa = new URLSearchParams({
      token,
      pesquisa: sku,
      formato: 'json'
    })

    const responsePesquisa = await fetch(`${urlPesquisa}?${paramsPesquisa}`)
    const dataPesquisa = await responsePesquisa.json()
    results.pesquisaProduto = dataPesquisa

    if (dataPesquisa.retorno?.status !== 'OK' || !dataPesquisa.retorno?.produtos?.length) {
      return NextResponse.json({ 
        ok: false, 
        error: `Produto não encontrado: ${sku}`, 
        results 
      })
    }

    const produto = dataPesquisa.retorno.produtos[0].produto
    results.produtoEncontrado = {
      id: produto.id,
      codigo: produto.codigo,
      nome: produto.nome,
      unidade: produto.unidade
    }

    // 3. Atualizar estoque - Formato XML sem indentação
    const estoqueXml = `<estoque><idProduto>${produto.id}</idProduto><tipo>${tipo}</tipo><quantidade>${quantidade}</quantidade><observacoes>Teste API</observacoes></estoque>`
    results.xmlEnviado = estoqueXml

    const urlEstoque = 'https://api.tiny.com.br/api2/produto.atualizar.estoque.php'
    
    const formData = new URLSearchParams()
    formData.append('token', token)
    formData.append('formato', 'json')
    formData.append('estoque', estoqueXml)

    results.requestBody = formData.toString()

    const responseEstoque = await fetch(urlEstoque, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    })

    const dataEstoque = await responseEstoque.json()
    results.respostaEstoque = dataEstoque

    const success = dataEstoque.retorno?.status === 'OK'
    
    return NextResponse.json({ 
      ok: success, 
      message: success ? 'Estoque atualizado!' : 'Erro ao atualizar estoque',
      error: success ? null : (dataEstoque.retorno?.erros?.[0]?.erro || 'Erro desconhecido'),
      sku,
      quantidade,
      tipo: tipo === 'E' ? 'Entrada' : 'Saida',
      results 
    })
  } catch (error) {
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : String(error),
      results 
    })
  }
}
