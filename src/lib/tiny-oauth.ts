import { prisma } from './prisma'
import { decrypt } from './crypto'

interface TinyTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

let cachedToken: { token: string; expiresAt: number } | null = null

export async function getTinyAccessToken(): Promise<string> {
  try {
    // Verificar cache
    if (cachedToken && cachedToken.expiresAt > Date.now()) {
      console.log('[OAuth] Usando token em cache')
      return cachedToken.token
    }

    // Tentar usar variáveis de ambiente primeiro (para Vercel)
    let clientId = process.env.TINY_CLIENT_ID
    let clientSecret = process.env.TINY_CLIENT_SECRET
    
    if (!clientId || !clientSecret) {
      console.log('[OAuth] Variáveis de ambiente não encontradas, buscando do banco...')
      
      // Buscar credenciais do banco
      const workspace = await prisma.workspace.findFirst({
        where: { name: 'Default' },
        include: { tinySettings: true }
      })

      if (!workspace?.tinySettings) {
        throw new Error('Tiny ERP não configurado. Configure em /settings/integrations/tiny')
      }

      clientId = workspace.tinySettings.clientId
      clientSecret = decrypt(workspace.tinySettings.clientSecretEncrypted)
      console.log('[OAuth] Credenciais encontradas no banco, Client ID:', clientId.substring(0, 20) + '...')
    } else {
      console.log('[OAuth] Usando credenciais das variáveis de ambiente')
    }

    console.log('[OAuth] Fazendo requisição OAuth via Edge Function proxy...')
    
    // Usar Edge Function proxy para contornar restrições de rede da Vercel
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000'
    
    const response = await fetch(`${baseUrl}/api/tiny-oauth-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientId,
        clientSecret,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('[OAuth] Erro do proxy:', error)
      throw new Error(error.error || 'Falha ao obter token do Tiny')
    }

    const data = await response.json() as TinyTokenResponse
    console.log('[OAuth] Token obtido com sucesso via proxy, expira em', data.expires_in, 'segundos')

    // Cachear token (expira em expires_in - 60 segundos de margem)
    cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 60) * 1000,
    }

    return data.access_token
  } catch (error) {
    console.error('[OAuth] Erro ao obter token:', error)
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Timeout ao conectar com Tiny ERP. Tente novamente.')
      }
      throw new Error(`Erro OAuth: ${error.message}`)
    }
    
    throw new Error('Erro desconhecido ao obter token do Tiny')
  }
}
