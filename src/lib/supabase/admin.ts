import { createClient } from '@supabase/supabase-js'
import { getSupabaseUrl } from '../env'

export function createSupabaseAdminClient() {
  console.log('[Supabase Admin] Criando cliente admin...')
  
  const supabaseUrl = getSupabaseUrl()
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log('[Supabase Admin] URL:', supabaseUrl || 'MISSING')
  console.log('[Supabase Admin] Service Key:', supabaseServiceKey ? 'OK (length: ' + supabaseServiceKey.length + ')' : 'MISSING')
  
  // Extrair ref do JWT para verificar se corresponde à URL
  if (supabaseServiceKey) {
    try {
      const payload = JSON.parse(atob(supabaseServiceKey.split('.')[1]))
      console.log('[Supabase Admin] Service Key ref:', payload.ref)
      console.log('[Supabase Admin] URL contém ref:', supabaseUrl?.includes(payload.ref) ? 'SIM ✅' : 'NÃO ❌ PROBLEMA!')
    } catch {
      console.log('[Supabase Admin] Não foi possível decodificar a chave')
    }
  }

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
