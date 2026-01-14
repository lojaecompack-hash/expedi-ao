import { NextResponse } from 'next/server'

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env var ${name}`)
  return v.trim()
}

function getRedirectUri(origin: string): string {
  return (process.env.TINY_REDIRECT_URI || `${origin}/api/tiny/callback`).trim()
}

export async function GET(req: Request) {
  try {
    const clientId = requireEnv('TINY_CLIENT_ID')
    const clientSecret = requireEnv('TINY_CLIENT_SECRET')

    const url = new URL(req.url)
    const origin = url.origin

    const code = url.searchParams.get('code')
    if (!code) {
      return NextResponse.json({ ok: false, error: 'Missing code' }, { status: 400 })
    }

    const redirectUri = getRedirectUri(origin)

    const tokenRes = await fetch(
      'https://accounts.tiny.com.br/realms/tiny/protocol/openid-connect/token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          code,
        }),
      },
    )

    const raw = await tokenRes.text()
    if (!tokenRes.ok) {
      return NextResponse.json(
        { ok: false, status: tokenRes.status, raw },
        { status: 502 },
      )
    }

    const data = JSON.parse(raw) as {
      access_token: string
      refresh_token?: string
      expires_in?: number
      token_type?: string
    }

    const accessToken = data.access_token
    if (!accessToken) {
      return NextResponse.json(
        { ok: false, error: 'Missing access_token in response', raw },
        { status: 502 },
      )
    }

    const state = url.searchParams.get('state')
    const next = state && state.startsWith('/') ? state : '/tiny-test'

    const res = NextResponse.redirect(new URL(next, origin))

    res.cookies.set('tiny_access_token', accessToken, {
      httpOnly: true,
      secure: url.protocol === 'https:',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 3,
    })

    if (data.refresh_token) {
      res.cookies.set('tiny_refresh_token', data.refresh_token, {
        httpOnly: true,
        secure: url.protocol === 'https:',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24,
      })
    }

    return res
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
