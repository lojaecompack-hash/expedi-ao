import { NextRequest, NextResponse } from 'next/server'
import { getTinyApiToken, getTinyProductBySku } from '@/lib/tiny-api'

// GET - Testar atualização de estoque na Tiny
export async function GET(request: NextRequest) {
  const results: Record<string, unknown> = {}
  
  try {
    const { searchParams } = new URL(request.url)
    const sku = searchParams.get('sku') || '26x36-eco'
    const quantidade = searchParams.get('quantidade') || '1'
    const tipo = searchParams.get('tipo') || 'E'

    // 1. Obter token
    results.step1_token = 'Obtendo token...'
    const token = await getTinyApiToken()
    results.step1_token = token ? `Token obtido: ${token.substring(0, 20)}...` : 'ERRO: Token não encontrado'

    if (!token) {
      return NextResponse.json({ ok: false, error: 'Token não encontrado', results })
    }

    // 2. Buscar produto pelo SKU
    results.step2_produto = 'Buscando produto...'
    const produto = await getTinyProductBySku(sku)
    results.step2_produto = produto ? {
      id: produto.id,
      codigo: produto.codigo,
      nome: produto.nome,
      unidade: produto.unidade
    } : `ERRO: Produto não encontrado para SKU: ${sku}`

    if (!produto) {
      return NextResponse.json({ ok: false, error: `Produto não encontrado: ${sku}`, results })
    }

    // 3. Testar diferentes formatos de chamada

    // Formato 1: Parâmetros na query string (método antigo)
    results.step3_formato1 = 'Testando formato 1 (query string)...'
    try {
      const url1 = 'https://api.tiny.com.br/api2/produto.atualizar.estoque.php'
      const params1 = new URLSearchParams({
        token,
        formato: 'json',
        idProduto: produto.id,
        tipo: tipo,
        quantidade: quantidade
      })
      
      const response1 = await fetch(`${url1}?${params1}`, { method: 'POST' })
      const data1 = await response1.json()
      results.step3_formato1 = { url: `${url1}?${params1}`, response: data1 }
    } catch (e) {
      results.step3_formato1 = { error: String(e) }
    }

    // Formato 2: POST com body JSON estruturado
    results.step4_formato2 = 'Testando formato 2 (body JSON)...'
    try {
      const url2 = 'https://api.tiny.com.br/api2/produto.atualizar.estoque.php'
      const estoqueData = {
        idProduto: produto.id,
        tipo: tipo,
        quantidade: quantidade
      }
      
      const formData2 = new URLSearchParams()
      formData2.append('token', token)
      formData2.append('formato', 'json')
      formData2.append('estoque', JSON.stringify(estoqueData))
      
      const response2 = await fetch(url2, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData2.toString()
      })
      const data2 = await response2.json()
      results.step4_formato2 = { body: formData2.toString(), response: data2 }
    } catch (e) {
      results.step4_formato2 = { error: String(e) }
    }

    // Formato 3: POST com XML
    results.step5_formato3 = 'Testando formato 3 (XML)...'
    try {
      const url3 = 'https://api.tiny.com.br/api2/produto.atualizar.estoque.php'
      const estoqueXml = `<estoque>
        <idProduto>${produto.id}</idProduto>
        <tipo>${tipo}</tipo>
        <quantidade>${quantidade}</quantidade>
      </estoque>`
      
      const formData3 = new URLSearchParams()
      formData3.append('token', token)
      formData3.append('formato', 'json')
      formData3.append('estoque', estoqueXml)
      
      const response3 = await fetch(url3, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData3.toString()
      })
      const data3 = await response3.json()
      results.step5_formato3 = { xml: estoqueXml, response: data3 }
    } catch (e) {
      results.step5_formato3 = { error: String(e) }
    }

    // Formato 4: Usando codigo ao invés de idProduto
    results.step6_formato4 = 'Testando formato 4 (codigo ao invés de idProduto)...'
    try {
      const url4 = 'https://api.tiny.com.br/api2/produto.atualizar.estoque.php'
      const estoqueXml4 = `<estoque>
        <codigo>${produto.codigo}</codigo>
        <tipo>${tipo}</tipo>
        <quantidade>${quantidade}</quantidade>
      </estoque>`
      
      const formData4 = new URLSearchParams()
      formData4.append('token', token)
      formData4.append('formato', 'json')
      formData4.append('estoque', estoqueXml4)
      
      const response4 = await fetch(url4, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData4.toString()
      })
      const data4 = await response4.json()
      results.step6_formato4 = { xml: estoqueXml4, response: data4 }
    } catch (e) {
      results.step6_formato4 = { error: String(e) }
    }

    return NextResponse.json({ 
      ok: true, 
      message: 'Testes concluídos - verifique os resultados de cada formato',
      sku,
      quantidade,
      tipo,
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
