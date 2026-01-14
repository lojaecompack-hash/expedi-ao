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

    const url = new URL(req.url)
    const origin = url.origin

    const redirectUri = getRedirectUri(origin)

    const authUrl = new URL(
      'https://accounts.tiny.com.br/realms/tiny/protocol/openid-connect/auth',
    )
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('scope', 'openid')
    authUrl.searchParams.set('response_type', 'code')

    const next = url.searchParams.get('next')
    if (next) authUrl.searchParams.set('state', next)

    const debug = url.searchParams.get('debug')
    if (debug === '1') {
      return NextResponse.json({
        ok: true,
        origin,
        redirectUri,
        authUrl: authUrl.toString(),
      })
    }

    return NextResponse.redirect(authUrl.toString())
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
