import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('[Test Connection] Testando conexão básica...')
    
    // Teste 1: Conexão básica
    await prisma.$queryRaw`SELECT 1 as test`
    console.log('[Test Connection] ✅ Conexão OK')
    
    // Teste 2: Verificar se Workspace existe
    const workspaceCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "Workspace"`
    console.log('[Test Connection] ✅ Workspace table exists:', workspaceCount)
    
    // Teste 3: Buscar workspace Default
    const workspace = await prisma.workspace.findFirst({
      where: { name: 'Default' }
    })
    console.log('[Test Connection] ✅ Workspace Default:', workspace ? 'Found' : 'Not found')
    
    return NextResponse.json({
      ok: true,
      connection: 'OK',
      workspace: workspace ? 'Found' : 'Not found',
      workspaceId: workspace?.id
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const stack = error instanceof Error ? error.stack : undefined
    
    console.error('[Test Connection] ❌ Error:', message)
    
    return NextResponse.json({
      ok: false,
      error: message,
      stack
    }, { status: 500 })
  }
}
