import { NextResponse } from 'next/server'
import { getTinyApiToken } from '@/lib/tiny-api'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id') // ID do pedido Tiny (ex: 883612853)
    
    if (!id) {
      return NextResponse.json({ error: 'Parâmetro id é obrigatório' }, { status: 400 })
    }

    const token = await getTinyApiToken()
    
    // Buscar detalhes completos do pedido
    const url = 'https://api.tiny.com.br/api2/pedido.obter.php'
    const params = new URLSearchParams({
      token,
      id,
      formato: 'JSON'
    })
    
    console.log('[Debug Tiny] Buscando pedido ID:', id)
    
    const response = await fetch(`${url}?${params.toString()}`)
    const data = await response.json()
    
    // Extrair o pedido
    const pedido = data.retorno?.pedido
    
    if (!pedido) {
      return NextResponse.json({
        ok: false,
        error: 'Pedido não encontrado',
        retorno: data.retorno
      })
    }

    // Listar TODOS os campos do pedido
    const campos = Object.keys(pedido)
    
    // Buscar campos que contenham "vendedor"
    const camposVendedor: Record<string, unknown> = {}
    for (const campo of campos) {
      if (campo.toLowerCase().includes('vend')) {
        camposVendedor[campo] = pedido[campo]
      }
    }

    return NextResponse.json({
      ok: true,
      id,
      campos_total: campos.length,
      todos_campos: campos,
      campos_vendedor: camposVendedor,
      pedido_completo: pedido
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
