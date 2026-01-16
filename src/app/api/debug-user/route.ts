import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Não autenticado' })
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email || '' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true
      }
    })

    return NextResponse.json({
      ok: true,
      supabaseUser: {
        id: user.id,
        email: user.email
      },
      dbUser: dbUser
    })
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) })
  }
}
