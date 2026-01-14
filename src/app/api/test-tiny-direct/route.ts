import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('[Test Tiny Direct] Testando conexão direta com Tiny OAuth...')
    
    const clientId = 'tiny-api-b2abb567aba95a697fa072325450f1f25f2390cc-1768250632'
    const clientSecret = process.env.TINY_CLIENT_SECRET || ''
    
    if (!clientSecret) {
      return NextResponse.json({
        ok: false,
        error: 'TINY_CLIENT_SECRET não configurado nas variáveis de ambiente'
      }, { status: 500 })
    }
    
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    })
    
    console.log('[Test Tiny Direct] Fazendo requisição OAuth...')
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)
    
    const startTime = Date.now()
    const response = await fetch('https://auth.tiny.com.br/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId))
    
    const duration = Date.now() - startTime
    
    console.log('[Test Tiny Direct] Resposta recebida em', duration, 'ms')
    
    if (!response.ok) {
      const text = await response.text()
      return NextResponse.json({
        ok: false,
        error: `Tiny OAuth falhou: ${response.status}`,
        details: text,
        duration
      }, { status: 500 })
    }
    
    const data = await response.json()
    
    return NextResponse.json({
      ok: true,
      message: 'OAuth funcionando!',
      tokenPreview: data.access_token.substring(0, 20) + '...',
      expiresIn: data.expires_in,
      duration
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const name = error instanceof Error ? error.name : 'Unknown'
    
    console.error('[Test Tiny Direct] Erro:', name, message)
    
    return NextResponse.json({
      ok: false,
      error: message,
      errorName: name,
      isTimeout: name === 'AbortError'
    }, { status: 500 })
  }
}
