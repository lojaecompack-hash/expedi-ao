import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export function createSupabaseMiddlewareClient(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  if (!url) throw new Error('Missing env var NEXT_PUBLIC_SUPABASE_URL')
  if (!anonKey) throw new Error('Missing env var NEXT_PUBLIC_SUPABASE_ANON_KEY')

  const res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          req.cookies.set(name, value)
          res.cookies.set(name, value, options)
        })
      },
    },
  })

  return { supabase, res }
}
