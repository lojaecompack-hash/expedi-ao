import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    const where: Record<string, unknown> = { isActive: true }
    if (type) {
      where.type = type
    }

    const operators = await prisma.productionOperator.findMany({
      where,
      orderBy: [
        { type: 'asc' },
        { name: 'asc' }
      ],
      select: {
        id: true,
        name: true,
        type: true,
        email: true,
        phone: true,
        isActive: true
      }
    })

    return NextResponse.json({ ok: true, operators })
  } catch (error) {
    console.error('Erro ao buscar operadores de produção:', error)
    return NextResponse.json({ ok: false, error: 'Erro ao buscar operadores' }, { status: 500 })
  }
}
