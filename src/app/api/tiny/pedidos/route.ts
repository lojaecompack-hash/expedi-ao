import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

import { tinyFetch } from '@/lib/tiny'

export async function GET(req: Request) {
  try {
    const accessToken = (await cookies()).get('tiny_access_token')?.value
    if (!accessToken) {
      return NextResponse.json(
        { ok: false, error: 'Not authenticated. Open /api/tiny/auth first.' },
        { status: 401 },
      )
    }

    const url = new URL(req.url)
    const idPedido = url.searchParams.get('idPedido')

    if (idPedido) {
      const id = Number(idPedido)
      if (!Number.isFinite(id) || id <= 0) {
        return NextResponse.json(
          { ok: false, error: 'Invalid idPedido' },
          { status: 400 },
        )
      }

      const result = await tinyFetch(`/pedidos/${id}`, { method: 'GET' }, accessToken)
      return NextResponse.json({ ok: true, tiny: result }, { status: 200 })
    }

    const limit = url.searchParams.get('limit') ?? '20'
    const offset = url.searchParams.get('offset') ?? '0'

    const result = await tinyFetch(
      `/pedidos?limit=${encodeURIComponent(limit)}&offset=${encodeURIComponent(offset)}`,
      { method: 'GET' },
      accessToken,
    )

    return NextResponse.json({ ok: true, tiny: result }, { status: 200 })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
