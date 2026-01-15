import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/crypto'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const orderNumber = searchParams.get('numero') || '2'
  try {
    console.log('[Debug Tiny] Iniciando diagnóstico...')
    
    // 1. Verificar workspace
    const workspace = await prisma.workspace.findFirst({
      where: { name: 'Default' },
      include: { tinySettings: true }
    })

    console.log('[Debug Tiny] Workspace:', workspace?.name || 'Not found')
    
    if (!workspace) {
      return NextResponse.json({
        ok: false,
        error: 'Workspace Default não encontrado',
        step: 'workspace_not_found'
      })
    }

    // 2. Verificar TinySettings
    if (!workspace.tinySettings) {
      return NextResponse.json({
        ok: false,
        error: 'TinySettings não configurado',
        workspaceId: workspace.id,
        step: 'tiny_settings_not_found'
      })
    }

    console.log('[Debug Tiny] TinySettings encontrado:', {
      id: workspace.tinySettings.id,
      hasApiToken: !!workspace.tinySettings.apiTokenEncrypted,
      isActive: workspace.tinySettings.isActive
    })

    // 3. Descriptografar token
    let token: string
    try {
      token = decrypt(workspace.tinySettings.apiTokenEncrypted)
      console.log('[Debug Tiny] Token descriptografado com sucesso')
      console.log('[Debug Tiny] Token (primeiros 20 chars):', token.substring(0, 20) + '...')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return NextResponse.json({
        ok: false,
        error: 'Erro ao descriptografar token: ' + message,
        step: 'decrypt_error'
      })
    }

    // 4. Testar requisição ao Tiny
    const url = 'https://api.tiny.com.br/api2/pedido.obter.php'
    const params = new URLSearchParams({
      token,
      numero: orderNumber,
      formato: 'JSON'
    })

    console.log('[Debug Tiny] Testando requisição ao Tiny...')
    console.log('[Debug Tiny] URL:', `${url}?token=***&numero=2&formato=JSON`)

    const response = await fetch(`${url}?${params.toString()}`)
    
    console.log('[Debug Tiny] Response status:', response.status)
    
    const data = await response.json()
    
    console.log('[Debug Tiny] Resposta do Tiny:', JSON.stringify(data, null, 2))

    return NextResponse.json({
      ok: true,
      workspace: {
        id: workspace.id,
        name: workspace.name
      },
      tinySettings: {
        id: workspace.tinySettings.id,
        hasApiToken: true,
        tokenPreview: token.substring(0, 20) + '...',
        isActive: workspace.tinySettings.isActive
      },
      tinyApiTest: {
        status: response.status,
        response: data
      }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Debug Tiny] Erro:', message)
    
    return NextResponse.json({
      ok: false,
      error: message,
      step: 'general_error'
    }, { status: 500 })
  }
}
