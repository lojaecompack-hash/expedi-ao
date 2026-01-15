import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('[Test Token] Verificando configuração do Tiny...')
    
    // Buscar workspace
    const workspace = await prisma.workspace.findFirst({
      where: { name: 'Default' },
      include: { tinySettings: true }
    })

    console.log('[Test Token] Workspace:', workspace?.name || 'Not found')
    
    if (!workspace) {
      return NextResponse.json({
        ok: false,
        error: 'Workspace Default não encontrado'
      })
    }

    if (!workspace.tinySettings) {
      return NextResponse.json({
        ok: false,
        error: 'TinySettings não configurado',
        workspaceId: workspace.id,
        message: 'Configure em /settings/integrations/tiny'
      })
    }

    console.log('[Test Token] TinySettings encontrado:', {
      id: workspace.tinySettings.id,
      hasApiToken: !!workspace.tinySettings.apiTokenEncrypted,
      isActive: workspace.tinySettings.isActive
    })

    return NextResponse.json({
      ok: true,
      configured: true,
      settings: {
        hasApiToken: !!workspace.tinySettings.apiTokenEncrypted,
        isActive: workspace.tinySettings.isActive,
        createdAt: workspace.tinySettings.createdAt
      }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Test Token] Erro:', message)
    
    return NextResponse.json({
      ok: false,
      error: message
    }, { status: 500 })
  }
}
