import { prisma } from './prisma'
import { decrypt } from './crypto'

interface TinyTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

let cachedToken: { token: string; expiresAt: number } | null = null

export async function getTinyAccessToken(): Promise<string> {
  // Verificar cache
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token
  }

  // Buscar credenciais do banco
  const workspace = await prisma.workspace.findFirst({
    where: { name: 'Default' },
    include: { tinySettings: true }
  })

  if (!workspace?.tinySettings) {
    throw new Error('Tiny ERP não configurado. Configure em /settings/integrations/tiny')
  }

  const { clientId, clientSecretEncrypted } = workspace.tinySettings
  const clientSecret = decrypt(clientSecretEncrypted)

  // Fazer requisição OAuth
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  })

  const response = await fetch('https://auth.tiny.com.br/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Falha ao obter token do Tiny: ${response.status} - ${text}`)
  }

  const data = await response.json() as TinyTokenResponse

  // Cachear token (expira em expires_in - 60 segundos de margem)
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  }

  return data.access_token
}
