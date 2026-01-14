import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const { clientId, clientSecret } = await req.json()
    
    if (!clientId || !clientSecret) {
      return NextResponse.json({
        ok: false,
        error: 'clientId e clientSecret são obrigatórios'
      }, { status: 400 })
    }

    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    })

    console.log('[OAuth Proxy] Fazendo requisição OAuth para Tiny...')
    
    const response = await fetch('https://auth.tiny.com.br/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    if (!response.ok) {
      const text = await response.text()
      console.error('[OAuth Proxy] Erro:', response.status, text)
      return NextResponse.json({
        ok: false,
        error: `Tiny OAuth falhou: ${response.status}`,
        details: text
      }, { status: response.status })
    }

    const data = await response.json()
    
    return NextResponse.json({
      ok: true,
      access_token: data.access_token,
      token_type: data.token_type,
      expires_in: data.expires_in
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[OAuth Proxy] Erro:', message)
    
    return NextResponse.json({
      ok: false,
      error: message
    }, { status: 500 })
  }
}
