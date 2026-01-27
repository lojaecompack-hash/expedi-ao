import { NextResponse } from 'next/server'
import { getTinyApiToken } from '@/lib/tiny-api'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id') // ID do pedido Tiny (ex: 883655640)
    
    if (!id) {
      return NextResponse.json({ error: 'Parâmetro id é obrigatório' }, { status: 400 })
    }

    const token = await getTinyApiToken()
    
    // Buscar expedição do pedido
    const url = 'https://api.tiny.com.br/api2/expedicao.obter.php'
    const params = new URLSearchParams({
      token,
      tipoObjeto: 'venda',
      idObjeto: id,
      formato: 'JSON'
    })
    
    console.log('[Debug Expedicao] Buscando expedição para pedido ID:', id)
    
    const response = await fetch(`${url}?${params.toString()}`)
    const data = await response.json()
    
    console.log('[Debug Expedicao] Resposta:', JSON.stringify(data, null, 2))

    // Extrair campos relevantes
    const expedicao = data.retorno?.expedicao
    
    if (!expedicao) {
      return NextResponse.json({
        ok: false,
        error: 'Expedição não encontrada',
        retorno: data.retorno
      })
    }

    // Listar todos os campos da expedição
    const campos = Object.keys(expedicao)
    
    // Buscar campos relacionados a forma de envio
    const camposFormaEnvio: Record<string, unknown> = {}
    for (const campo of campos) {
      const lower = campo.toLowerCase()
      if (lower.includes('forma') || lower.includes('envio') || lower.includes('transport') || lower.includes('logistic')) {
        camposFormaEnvio[campo] = expedicao[campo]
      }
    }

    return NextResponse.json({
      ok: true,
      id,
      campos_total: campos.length,
      todos_campos: campos,
      campos_forma_envio: camposFormaEnvio,
      expedicao_completa: expedicao
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
