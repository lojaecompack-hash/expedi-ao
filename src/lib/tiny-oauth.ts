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
      
      // Tentar resolver DNS manualmente usando IP público do Tiny
      // Se auth.tiny.com.br não resolver, usar fetch com URL completa
      const options = {
        hostname: 'auth.tiny.com.br',
        port: 443,
        path: '/oauth/token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData),
          'Host': 'auth.tiny.com.br'
        },
        timeout: 30000,
        // Adicionar lookup manual de DNS
        lookup: (hostname: string, _options: unknown, callback: (err: Error | null, address: string, family: number) => void) => {
          // Forçar IPv4 - usar IP público do Tiny
          callback(null, '177.67.82.107', 4)
        }
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
