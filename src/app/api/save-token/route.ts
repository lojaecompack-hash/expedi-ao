import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/crypto'

export async function POST(req: Request) {
  try {
    console.log('[Save Token] Salvando Token API...')
    
    const body = await req.json()
    const { apiToken } = body

    if (!apiToken) {
      return NextResponse.json(
        { error: 'apiToken is required' },
        { status: 400 }
      )
    }

    // Buscar ou criar workspace padrão
    let workspace = await prisma.workspace.findFirst({
      where: { name: 'Default' },
    })

    if (!workspace) {
      workspace = await prisma.workspace.create({
        data: { name: 'Default' },
      })
    }

    // Criptografar e salvar o token
    const apiTokenEncrypted = encrypt(apiToken)

    const tinySettings = await prisma.tinySettings.upsert({
      where: { workspaceId: workspace.id },
      update: {
        apiTokenEncrypted,
        isActive: true,
      },
      create: {
        workspaceId: workspace.id,
        apiTokenEncrypted,
        isActive: true,
      },
    })

    console.log('[Save Token] Token salvo com sucesso!')

    return NextResponse.json({
      ok: true,
      message: 'Token API salvo com sucesso!',
      settings: {
        id: tinySettings.id,
        isActive: tinySettings.isActive,
      }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Save Token] Erro:', message)
    
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
