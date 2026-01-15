import { NextResponse } from 'next/server'
import { getTinyApiToken } from '@/lib/tiny-api'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id') || '337790876' // ID do pedido 2
    const situacao = searchParams.get('situacao') || 'enviado'
    
    const token = await getTinyApiToken()
    
    const url = 'https://api.tiny.com.br/api2/pedido.alterar.situacao.php'
    const params = new URLSearchParams({
      token,
      id,
      situacao,
      formato: 'JSON'
    })

    console.log('[Test Status] Testando alteração de status...')
    console.log('[Test Status] ID:', id)
    console.log('[Test Status] Situação:', situacao)

    const response = await fetch(`${url}?${params.toString()}`, {
      method: 'POST'
    })
    
    const data = await response.json()
    
    console.log('[Test Status] Resposta:', JSON.stringify(data, null, 2))

    return NextResponse.json({
      ok: true,
      id,
      situacao,
      response: data
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
