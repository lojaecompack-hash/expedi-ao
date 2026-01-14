import { prisma } from './prisma'
import { decrypt } from './crypto'
import https from 'https'

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

    console.log('[OAuth] Buscando credenciais do banco...')
    
    // Buscar credenciais do banco
    const workspace = await prisma.workspace.findFirst({
      where: { name: 'Default' },
      include: { tinySettings: true }
    })

    if (!workspace?.tinySettings) {
      throw new Error('Tiny ERP não configurado. Configure em /settings/integrations/tiny')
    }

    const { clientId, clientSecretEncrypted } = workspace.tinySettings
    console.log('[OAuth] Credenciais encontradas, Client ID:', clientId.substring(0, 20) + '...')
    
    const clientSecret = decrypt(clientSecretEncrypted)

    // Fazer requisição OAuth
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    })

    console.log('[OAuth] Fazendo requisição OAuth para Tiny...')
    
    // Usar https nativo ao invés de fetch (Vercel bloqueia fetch para alguns domínios)
    const data = await new Promise<TinyTokenResponse>((resolve, reject) => {
      const postData = params.toString()
      
      const options = {
        hostname: 'auth.tiny.com.br',
        port: 443,
        path: '/oauth/token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 30000
      }

      const req = https.request(options, (res) => {
        let body = ''
        
        res.on('data', (chunk) => {
          body += chunk
        })
        
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const json = JSON.parse(body) as TinyTokenResponse
              console.log('[OAuth] Token obtido com sucesso, expira em', json.expires_in, 'segundos')
              resolve(json)
            } catch (error) {
              reject(new Error(`Erro ao parsear resposta: ${body}`))
            }
          } else {
            console.error('[OAuth] Erro na resposta:', res.statusCode, body)
            reject(new Error(`Falha ao obter token do Tiny: ${res.statusCode} - ${body}`))
          }
        })
      })

      req.on('error', (error) => {
        console.error('[OAuth] Erro na requisição:', error)
        reject(error)
      })

      req.on('timeout', () => {
        req.destroy()
        reject(new Error('Timeout ao conectar com Tiny ERP'))
      })

      req.write(postData)
      req.end()
    })

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
