import { NextResponse } from 'next/server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth.getUser()

  const user = data.user
  if (!user) {
    return NextResponse.json({
      authenticated: false,
      user: null,
      workspace: null,
      membership: null,
    })
  }

  const bootstrapAdminEmail =
    process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase() ||
    'lojaecompack@gmail.com'

  const isAdmin = (user.email || '').toLowerCase() === bootstrapAdminEmail

  try {
    const workspace = await prisma.workspace.upsert({
      where: { name: 'Default' },
      update: {},
      create: { name: 'Default' },
      select: { id: true, name: true },
    })

    const membership = await prisma.membership.upsert({
      where: {
        workspaceId_userId: {
          workspaceId: workspace.id,
          userId: user.id,
        },
      },
      update: {
        email: user.email,
        permissions: isAdmin ? ['ADMIN', 'SETTINGS', 'EXPEDICAO'] : ['EXPEDICAO'],
      },
      create: {
        workspaceId: workspace.id,
        userId: user.id,
        email: user.email,
        permissions: isAdmin ? ['ADMIN', 'SETTINGS', 'EXPEDICAO'] : ['EXPEDICAO'],
      },
      select: { id: true, userId: true, email: true, permissions: true },
    })

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
      },
      workspace,
      membership,
    })
  } catch (error) {
    console.error('Error in /api/session:', error)
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
      },
      workspace: null,
      membership: null,
      error: 'Failed to load workspace/membership',
    })
  }
}
