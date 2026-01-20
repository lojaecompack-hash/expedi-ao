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
  
  // Se for dev.ecomlogic.com.br, é desenvolvimento
  if (vercelUrl.includes('dev.ecomlogic.com.br')) {
    return 'development'
  }
  
  // Se for www.ecomlogic.com.br ou expedi-ao.vercel.app, é produção
  if (vercelUrl.includes('www.ecomlogic.com.br') || vercelUrl.includes('expedi-ao.vercel.app')) {
    return 'production'
  }
  
  // Default: usar VERCEL_ENV para determinar
  // Preview = desenvolvimento, Production = produção
  const vercelEnv = process.env.VERCEL_ENV
  if (vercelEnv === 'preview') {
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
console.log(`[ENV] VERCEL_URL: ${process.env.VERCEL_URL}`)
console.log(`[ENV] VERCEL_ENV: ${process.env.VERCEL_ENV}`)

/**
 * Configurações do banco de dados
 */
export function getDatabaseUrl(): string {
  // Desenvolvimento: usar variáveis de Preview
  if (IS_DEV) {
    console.log('[ENV] Usando DATABASE_URL (Preview/Desenvolvimento)')
    return process.env.DATABASE_URL || ''
  }
  
  // Produção: usar DATABASE_URL
  console.log('[ENV] Usando DATABASE_URL (Production)')
  return process.env.DATABASE_URL || ''
}

/**
 * Configurações do Supabase
 */
export function getSupabaseUrl(): string {
  // Desenvolvimento e Produção usam as mesmas variáveis
  // A Vercel separa automaticamente por ambiente (Production/Preview)
  return process.env.NEXT_PUBLIC_SUPABASE_URL || ''
}

export function getSupabaseAnonKey(): string {
  // Desenvolvimento e Produção usam as mesmas variáveis
  // A Vercel separa automaticamente por ambiente (Production/Preview)
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
