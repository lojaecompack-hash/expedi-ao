import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    // Usar $queryRaw para evitar prepared statements no pooler
    const workspaces = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "Workspace"`
    const memberships = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "Membership"`
    
    const workspaceCount = Number((workspaces as any)[0]?.count || 0)
    const membershipCount = Number((memberships as any)[0]?.count || 0)
    
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
