import { NextResponse } from 'next/server'

import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const url = new URL(req.url)
  const secure = url.protocol === 'https:'

  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()

  const res = NextResponse.json({ ok: true })

  res.cookies.set('tiny_access_token', '', {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })

  res.cookies.set('tiny_refresh_token', '', {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })

  return res
}
