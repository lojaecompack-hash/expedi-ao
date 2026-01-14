import { createBrowserClient } from '@supabase/ssr'

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  if (!url) throw new Error('Missing env var NEXT_PUBLIC_SUPABASE_URL')
  if (!anonKey) throw new Error('Missing env var NEXT_PUBLIC_SUPABASE_ANON_KEY')

  return createBrowserClient(url, anonKey)
}
