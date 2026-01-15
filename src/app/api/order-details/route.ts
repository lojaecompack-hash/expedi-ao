import { NextResponse } from 'next/server'
import { getTinyOrderDetails } from '@/lib/tiny-api'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const number = searchParams.get('number')
    
    // Validação
    if (!number || number.length < 2) {
      return NextResponse.json(
        { error: 'Número do pedido inválido ou muito curto' },
        { status: 400 }
      )
    }
    
    console.log('[Order Details API] Buscando pedido:', number)
    
    // Buscar detalhes do pedido
    const details = await getTinyOrderDetails(number)
    
    if (!details) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      )
    }
    
    console.log('[Order Details API] Pedido encontrado:', details.numero)
    
    return NextResponse.json(details, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[Order Details API] Erro:', message)
    
    return NextResponse.json(
      { error: 'Erro ao buscar detalhes do pedido', details: message },
      { status: 500 }
    )
  }
}
