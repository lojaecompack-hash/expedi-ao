import { NextResponse } from 'next/server'
import { getTinyApiToken } from '@/lib/tiny-api'

export async function GET() {
  try {
    const token = await getTinyApiToken()
    
    const url = 'https://api.tiny.com.br/api2/pedidos.pesquisa.php'
    const params = new URLSearchParams({
      token,
      formato: 'JSON'
    })

    const response = await fetch(`${url}?${params.toString()}`)
    const data = await response.json()
    
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
