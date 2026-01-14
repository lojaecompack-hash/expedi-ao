import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

import { setPedidoSituacao } from '@/lib/tiny'

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      idPedido?: number
      dryRun?: boolean
    }

    const idPedido = body.idPedido
    if (!idPedido || typeof idPedido !== 'number') {
      return NextResponse.json(
        { error: 'Missing or invalid idPedido (number)' },
        { status: 400 },
      )
    }

    const dryRunEnv = process.env.TINY_DRY_RUN
    const dryRun = body.dryRun ?? (dryRunEnv ? dryRunEnv !== '0' : true)

    if (dryRun) {
      return NextResponse.json({
        ok: true,
        dryRun: true,
        wouldCall: {
          method: 'PUT',
          path: `/pedidos/${idPedido}/situacao`,
          body: { situacao: 5 },
        },
      })
    }

    const accessToken = (await cookies()).get('tiny_access_token')?.value
    if (!accessToken) {
      return NextResponse.json(
        { ok: false, error: 'Not authenticated. Open /api/tiny/auth first.' },
        { status: 401 },
      )
    }

    const result = await setPedidoSituacao({ idPedido, situacao: 5, token: accessToken })

    if (result.status >= 200 && result.status < 300) {
      return NextResponse.json({ ok: true, dryRun: false, tiny: result })
    }

    return NextResponse.json(
      { ok: false, dryRun: false, tiny: result },
      { status: 502 },
    )
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
