import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/get-user-role'

export async function GET() {
  try {
    const role = await getUserRole()

    if (!role) {
      return NextResponse.json(
        { ok: false, error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      ok: true,
      role
    }, { status: 200 })
  } catch (error) {
    console.error('[User Role API] Erro:', error)
    return NextResponse.json(
      { ok: false, error: 'Erro ao buscar role do usuário' },
      { status: 500 }
    )
  }
}
