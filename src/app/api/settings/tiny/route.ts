import { NextResponse } from 'next/server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { encrypt, decrypt } from '@/lib/crypto'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase.auth.getUser()

    if (!data.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
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

    // Buscar settings do Tiny
    const tinySettings = await prisma.tinySettings.findUnique({
      where: { workspaceId: workspace.id },
      select: {
        id: true,
        clientId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      configured: Boolean(tinySettings),
      settings: tinySettings
        ? {
            clientId: tinySettings.clientId,
            isActive: tinySettings.isActive,
            createdAt: tinySettings.createdAt,
            updatedAt: tinySettings.updatedAt,
          }
        : null,
    })
  } catch (error) {
    console.error('Error in GET /api/settings/tiny:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase.auth.getUser()

    if (!data.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
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

    const body = await req.json()
    const { clientId, clientSecret } = body

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'clientId and clientSecret are required' },
        { status: 400 },
      )
    }

    // Criptografar o client secret
    const clientSecretEncrypted = encrypt(clientSecret)

    // Salvar ou atualizar settings
    const tinySettings = await prisma.tinySettings.upsert({
      where: { workspaceId: workspace.id },
      update: {
        clientId,
        clientSecretEncrypted,
        isActive: true,
      },
      create: {
        workspaceId: workspace.id,
        clientId,
        clientSecretEncrypted,
        isActive: true,
      },
      select: {
        id: true,
        clientId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      ok: true,
      settings: {
        clientId: tinySettings.clientId,
        isActive: tinySettings.isActive,
        createdAt: tinySettings.createdAt,
        updatedAt: tinySettings.updatedAt,
      },
    })
  } catch (error) {
    console.error('Error in POST /api/settings/tiny:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
