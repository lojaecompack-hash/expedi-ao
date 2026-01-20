import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSupabaseUrl, getSupabaseAnonKey } from '../env'

export async function createSupabaseServerClient() {
  const url = getSupabaseUrl()?.trim()
  const anonKey = getSupabaseAnonKey()?.trim()

  if (!url) throw new Error('Missing Supabase URL')
  if (!anonKey) throw new Error('Missing Supabase Anon Key')

  const cookieStore = await cookies()

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // ignore if called from a Server Component
        }
      },
    },
  })
}
