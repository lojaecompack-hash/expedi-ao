/**
 * Configuração de Ambientes - Estrutura Profissional
 * 
 * Detecta automaticamente o ambiente baseado no domínio:
 * - www.ecomlogic.com.br → PRODUÇÃO
 * - dev.ecomlogic.com.br → DESENVOLVIMENTO
 * 
 * Cada ambiente usa suas próprias variáveis:
 * - Banco de dados separado
 * - Supabase separado
 * - Token Tiny separado
 */

export type Environment = 'production' | 'development'

// Detectar ambiente baseado no domínio
function detectEnvironment(): Environment {
  // Server-side: usar VERCEL_URL
  const vercelUrl = process.env.VERCEL_URL || ''
  
  if (vercelUrl.includes('dev.ecomlogic.com.br')) {
    return 'development'
  }
  
  // Default: produção
  return 'production'
}

export const ENV = detectEnvironment()
export const IS_DEV = ENV === 'development'
export const IS_PROD = ENV === 'production'

// Log do ambiente atual
console.log(`[ENV] Ambiente detectado: ${ENV.toUpperCase()}`)

/**
 * Configurações do banco de dados
 */
export function getDatabaseUrl(): string {
  if (IS_DEV) {
    const devUrl = process.env.DATABASE_URL_DEV
    if (devUrl) {
      console.log('[ENV] Usando DATABASE_URL_DEV (desenvolvimento)')
      return devUrl
    }
    console.warn('[ENV] DATABASE_URL_DEV não configurada, usando DATABASE_URL')
  }
  
  console.log('[ENV] Usando DATABASE_URL (produção)')
  return process.env.DATABASE_URL || ''
}

/**
 * Configurações do Supabase
 */
export function getSupabaseUrl(): string {
  if (IS_DEV) {
    const devUrl = process.env.NEXT_PUBLIC_SUPABASE_URL_DEV
    if (devUrl) {
      console.log('[ENV] Usando SUPABASE_URL_DEV (desenvolvimento)')
      return devUrl
    }
    console.warn('[ENV] SUPABASE_URL_DEV não configurada, usando padrão')
  }
  
  console.log('[ENV] Usando SUPABASE_URL (produção)')
  return process.env.NEXT_PUBLIC_SUPABASE_URL || ''
}

export function getSupabaseAnonKey(): string {
  if (IS_DEV) {
    const devKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_DEV
    if (devKey) {
      console.log('[ENV] Usando SUPABASE_ANON_KEY_DEV (desenvolvimento)')
      return devKey
    }
    console.warn('[ENV] SUPABASE_ANON_KEY_DEV não configurada, usando padrão')
  }
  
  console.log('[ENV] Usando SUPABASE_ANON_KEY (produção)')
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
}

/**
 * Configurações do Token Tiny
 */
export function shouldUseTinyTestToken(): boolean {
  return IS_DEV && !!process.env.TINY_API_TOKEN_OVERRIDE
}

export function getTinyTestToken(): string | null {
  if (IS_DEV) {
    return process.env.TINY_API_TOKEN_OVERRIDE || null
  }
  return null
}

/**
 * Resumo da configuração atual
 */
export function getEnvSummary() {
  return {
    environment: ENV,
    isDev: IS_DEV,
    isProd: IS_PROD,
    databaseUrl: getDatabaseUrl().substring(0, 50) + '...',
    supabaseUrl: getSupabaseUrl(),
    hasTinyTestToken: shouldUseTinyTestToken()
  }
}
