import { NextResponse } from 'next/server'
import { getTinyApiToken } from '@/lib/tiny-api'

export async function GET() {
  try {
    const token = await getTinyApiToken()
    
    // Buscar formas de envio cadastradas no Tiny
    const url = 'https://api.tiny.com.br/api2/formas.envio.pesquisa.php'
    const params = new URLSearchParams({
      token,
      formato: 'JSON'
    })
    
    console.log('[Debug Formas Envio] Buscando formas de envio...')
    
    const response = await fetch(`${url}?${params.toString()}`)
    const data = await response.json()
    
    console.log('[Debug Formas Envio] Resposta:', JSON.stringify(data, null, 2))

    return NextResponse.json({
      ok: true,
      data: data.retorno
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
