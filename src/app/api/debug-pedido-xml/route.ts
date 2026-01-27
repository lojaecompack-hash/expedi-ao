import { NextResponse } from 'next/server'
import { getTinyApiToken } from '@/lib/tiny-api'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Parâmetro id é obrigatório' }, { status: 400 })
    }

    const token = await getTinyApiToken()
    
    // Buscar pedido em XML
    const url = 'https://api.tiny.com.br/api2/pedido.obter.php'
    const params = new URLSearchParams({
      token,
      id,
      formato: 'XML'
    })
    
    console.log('[Debug XML] Buscando pedido ID:', id)
    
    const response = await fetch(`${url}?${params.toString()}`)
    const xmlText = await response.text()
    
    console.log('[Debug XML] Resposta XML:', xmlText.substring(0, 500))

    // Buscar também em JSON para comparar
    const paramsJson = new URLSearchParams({
      token,
      id,
      formato: 'JSON'
    })
    
    const responseJson = await fetch(`${url}?${paramsJson.toString()}`)
    const jsonData = await responseJson.json()

    // Procurar por idformaenvio ou id_forma_envio no XML
    const hasIdFormaEnvio = xmlText.toLowerCase().includes('idformaenvio') || 
                            xmlText.toLowerCase().includes('id_forma_envio') ||
                            xmlText.toLowerCase().includes('idforma')

    return NextResponse.json({
      ok: true,
      id,
      hasIdFormaEnvioInXml: hasIdFormaEnvio,
      xmlLength: xmlText.length,
      xmlPreview: xmlText.substring(0, 2000),
      jsonData: jsonData
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
