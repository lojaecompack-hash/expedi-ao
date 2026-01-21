/**
 * Configuração de Ambientes - SIMPLIFICADO
 * 
 * DESENVOLVIMENTO: localhost (npm run dev)
 * PRODUÇÃO: www.ecomlogic.com.br (Vercel)
 */

export type Environment = 'production' | 'development'

// Detectar ambiente: localhost = dev, resto = produção
function detectEnvironment(): Environment {
  // Se estiver rodando localmente
  if (process.env.NODE_ENV === 'development') {
    return 'development'
  }
  
  // Qualquer deploy na Vercel = produção
  return 'production'
}

export const ENV = detectEnvironment()
export const IS_DEV = ENV === 'development'
export const IS_PROD = ENV === 'production'

// Log do ambiente atual
console.log(`[ENV] Ambiente: ${ENV.toUpperCase()}`)

/**
 * Configurações do banco de dados
 */
export function getDatabaseUrl(): string {
  return process.env.DATABASE_URL || ''
}

/**
 * Configurações do Supabase
 */
export function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || ''
}

export function getSupabaseAnonKey(): string {
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
