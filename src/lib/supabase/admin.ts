import { createClient } from '@supabase/supabase-js'
import { getSupabaseUrl } from '../env'

export function createSupabaseAdminClient() {
  console.log('[Supabase Admin] Criando cliente admin...')
  
  const supabaseUrl = getSupabaseUrl()
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log('[Supabase Admin] URL:', supabaseUrl ? 'OK' : 'MISSING')
  console.log('[Supabase Admin] Service Key:', supabaseServiceKey ? 'OK (length: ' + supabaseServiceKey.length + ')' : 'MISSING')

  if (!supabaseUrl) {
    console.error('[Supabase Admin] ERRO: Missing NEXT_PUBLIC_SUPABASE_URL')
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
  }

  if (!supabaseServiceKey) {
    console.error('[Supabase Admin] ERRO: Missing SUPABASE_SERVICE_ROLE_KEY')
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
  }

  console.log('[Supabase Admin] Cliente criado com sucesso')
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
