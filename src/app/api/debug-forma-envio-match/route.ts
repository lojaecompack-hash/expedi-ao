import { NextResponse } from 'next/server'
import { getTinyApiToken } from '@/lib/tiny-api'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const idPedido = searchParams.get('id')
    
    if (!idPedido) {
      return NextResponse.json({ error: 'Parâmetro id é obrigatório' }, { status: 400 })
    }

    const token = await getTinyApiToken()
    
    // 1. Buscar expedição do pedido
    const expedicaoUrl = 'https://api.tiny.com.br/api2/expedicao.obter.php'
    const expedicaoParams = new URLSearchParams({
      token,
      tipoObjeto: 'venda',
      idObjeto: idPedido,
      formato: 'JSON'
    })
    
    const expedicaoRes = await fetch(`${expedicaoUrl}?${expedicaoParams.toString()}`)
    const expedicaoData = await expedicaoRes.json()
    
    const expedicao = expedicaoData.retorno?.expedicao
    const formaFreteId = expedicao?.formaFrete?.id
    const transportadoraId = expedicao?.transportadora?.id
    
    // 2. Se temos um ID válido (não zero), buscar detalhes da forma de envio
    let formaEnvioDetalhes = null
    if (formaFreteId && formaFreteId !== 0 && formaFreteId !== '0') {
      const formaEnvioUrl = 'https://api.tiny.com.br/api2/formas.envio.obter.php'
      const formaEnvioParams = new URLSearchParams({
        token,
        idFormaEnvio: String(formaFreteId),
        formato: 'JSON'
      })
      
      const formaEnvioRes = await fetch(`${formaEnvioUrl}?${formaEnvioParams.toString()}`)
      formaEnvioDetalhes = await formaEnvioRes.json()
    }
    
    // 3. Buscar todas as formas de envio
    const listaUrl = 'https://api.tiny.com.br/api2/formas.envio.pesquisa.php'
    const listaParams = new URLSearchParams({
      token,
      formato: 'JSON'
    })
    
    const listaRes = await fetch(`${listaUrl}?${listaParams.toString()}`)
    const listaData = await listaRes.json()
    
    const formasEnvio = listaData.retorno?.registros || []
    
    // 4. Buscar pedido completo para ver todos os campos
    const pedidoUrl = 'https://api.tiny.com.br/api2/pedido.obter.php'
    const pedidoParams = new URLSearchParams({
      token,
      id: idPedido,
      formato: 'JSON'
    })
    
    const pedidoRes = await fetch(`${pedidoUrl}?${pedidoParams.toString()}`)
    const pedidoData = await pedidoRes.json()
    
    const pedido = pedidoData.retorno?.pedido
    
    // Extrair TODOS os campos do pedido para análise
    const pedidoCompleto = pedido ? Object.keys(pedido) : []
    
    // Buscar campos que contenham "envio", "frete", "transport", "gateway", "logistic"
    const camposRelevantes: Record<string, unknown> = {}
    if (pedido) {
      for (const [key, value] of Object.entries(pedido)) {
        const keyLower = key.toLowerCase()
        if (keyLower.includes('envio') || 
            keyLower.includes('frete') || 
            keyLower.includes('transport') || 
            keyLower.includes('gateway') || 
            keyLower.includes('logistic') ||
            keyLower.includes('expedicao') ||
            keyLower.includes('correio') ||
            keyLower.includes('pac') ||
            keyLower.includes('sedex')) {
          camposRelevantes[key] = value
        }
      }
    }
    
    // 5. Tentar encontrar match pelo nome_transportador se existir
    let matchPorNome = null
    if (pedido?.nome_transportador && pedido.nome_transportador.trim() !== '') {
      const nomeTransp = pedido.nome_transportador.toUpperCase().trim()
      matchPorNome = formasEnvio.find((f: { nome: string }) => 
        f.nome.toUpperCase().trim() === nomeTransp ||
        f.nome.toUpperCase().trim().includes(nomeTransp) ||
        nomeTransp.includes(f.nome.toUpperCase().trim())
      )
    }

    return NextResponse.json({
      ok: true,
      idPedido,
      expedicao: {
        formaEnvio: expedicao?.formaEnvio,
        formaFreteId,
        formaFreteDescricao: expedicao?.formaFrete?.descricao,
        transportadoraId,
        transportadoraNome: expedicao?.transportadora?.nome,
        expedicaoCompleta: expedicao
      },
      pedido: {
        forma_envio: pedido?.forma_envio,
        nome_transportador: pedido?.nome_transportador,
        deposito: pedido?.deposito
      },
      camposRelevantes,
      todosCamposPedido: pedidoCompleto,
      formaEnvioDetalhes,
      matchPorNome,
      totalFormasEnvio: formasEnvio.length,
      mensagem: formaFreteId && formaFreteId !== 0 && formaFreteId !== '0' 
        ? `ID da forma de frete encontrado: ${formaFreteId}` 
        : 'ID da forma de frete está zerado ou não definido'
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
