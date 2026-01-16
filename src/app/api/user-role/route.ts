import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    // Buscar role do usuário no banco
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email || '' },
      select: { role: true, email: true, name: true }
    })

    if (!dbUser) {
      return NextResponse.json(
        { ok: false, error: 'Usuário não encontrado no banco' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ok: true,
      role: dbUser.role,
      email: dbUser.email,
      name: dbUser.name
    }, { status: 200 })
  } catch (error) {
    console.error('[User Role API] Erro:', error)
    return NextResponse.json(
      { ok: false, error: 'Erro ao buscar role do usuário' },
      { status: 500 }
    )
  }
}
