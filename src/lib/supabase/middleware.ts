import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseUrl, getSupabaseAnonKey } from '../env'

export function createSupabaseMiddlewareClient(req: NextRequest) {
  const url = getSupabaseUrl()?.trim()
  const anonKey = getSupabaseAnonKey()?.trim()

  if (!url) throw new Error('Missing Supabase URL')
  if (!anonKey) throw new Error('Missing Supabase Anon Key')

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
