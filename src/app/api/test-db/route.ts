import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const workspaceCount = await prisma.workspace.count()
    const membershipCount = await prisma.membership.count()
    
    return NextResponse.json({
      ok: true,
      database: 'connected',
      workspaces: workspaceCount,
      memberships: membershipCount,
      message: 'Database connection successful'
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({
      ok: false,
      database: 'error',
      error: message
    }, { status: 500 })
  }
}
