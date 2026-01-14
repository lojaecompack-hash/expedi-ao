import { NextResponse } from 'next/server'
import { getTinyAccessToken } from '@/lib/tiny-oauth'

export async function GET() {
  try {
    console.log('[Test OAuth] Iniciando teste...')
    const token = await getTinyAccessToken()
    
    return NextResponse.json({
      ok: true,
      message: 'OAuth funcionando!',
      tokenPreview: token.substring(0, 20) + '...',
      tokenLength: token.length
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const stack = error instanceof Error ? error.stack : undefined
    
    console.error('[Test OAuth] Erro:', message, stack)
    
    return NextResponse.json({
      ok: false,
      error: message,
      stack
    }, { status: 500 })
  }
}
