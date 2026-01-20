import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/crypto'

export async function GET() {
  try {
    const workspace = await prisma.workspace.findFirst({
      where: { name: 'Default' },
      include: { tinySettings: true }
    })

    if (!workspace?.tinySettings) {
      return NextResponse.json({ error: 'Tiny não configurado' }, { status: 404 })
    }

    return NextResponse.json({
      environment: workspace.tinySettings.environment,
      hasTestToken: !!workspace.tinySettings.apiTokenTestEncrypted,
      hasProductionToken: !!workspace.tinySettings.apiTokenEncrypted
    })
  } catch (error) {
    console.error('[Tiny Environment] Erro ao buscar:', error)
    return NextResponse.json({ error: 'Erro ao buscar configuração' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { environment, testToken } = body

    const workspace = await prisma.workspace.findFirst({
      where: { name: 'Default' },
      include: { tinySettings: true }
    })

    if (!workspace?.tinySettings) {
      return NextResponse.json({ error: 'Tiny não configurado' }, { status: 404 })
    }

    const updateData: {
      environment?: string
      apiTokenTestEncrypted?: string
    } = {}

    if (environment && (environment === 'production' || environment === 'test')) {
      updateData.environment = environment
    }

    if (testToken) {
      updateData.apiTokenTestEncrypted = encrypt(testToken)
    }

    await prisma.tinySettings.update({
      where: { id: workspace.tinySettings.id },
      data: updateData
    })

    return NextResponse.json({ 
      success: true,
      message: `Ambiente alterado para ${environment === 'test' ? 'TESTE' : 'PRODUÇÃO'}`
    })
  } catch (error) {
    console.error('[Tiny Environment] Erro ao atualizar:', error)
    return NextResponse.json({ error: 'Erro ao atualizar configuração' }, { status: 500 })
  }
}
