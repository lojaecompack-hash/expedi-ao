import { createBrowserClient } from '@supabase/ssr'
import { getSupabaseUrl, getSupabaseAnonKey } from '../env'

export function createSupabaseBrowserClient() {
  const url = getSupabaseUrl()?.trim()
  const anonKey = getSupabaseAnonKey()?.trim()

  if (!url) throw new Error('Missing Supabase URL')
  if (!anonKey) throw new Error('Missing Supabase Anon Key')

  return createBrowserClient(url, anonKey)
}
