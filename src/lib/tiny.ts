type TinyRequestInit = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>
}

function getTinyToken(passedToken?: string): string {
  if (passedToken) return passedToken

  const token = process.env.TINY_API_TOKEN
  if (!token) {
    throw new Error('Missing env var TINY_API_TOKEN')
  }
  return token
}

export async function tinyFetch<T = unknown>(
  path: string,
  init: TinyRequestInit = {},
  token?: string,
): Promise<{ status: number; data?: T; rawText?: string }> {
  const resolvedToken = getTinyToken(token)
  const url = `https://erp.tiny.com.br/public-api/v3${path}`

  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.headers ?? {}),
      Authorization: `Bearer ${resolvedToken}`,
    },
  })

  const contentType = res.headers.get('content-type') || ''
  const status = res.status

  if (status === 204) {
    return { status }
  }

  const rawText = await res.text()

  if (contentType.includes('application/json')) {
    const trimmed = rawText.trim()
    if (!trimmed) {
      return { status }
    }

    const data = JSON.parse(trimmed) as T
    return { status, data }
  }

  return { status, rawText }
}

export async function setPedidoSituacao(params: {
  idPedido: number
  situacao: number
  token?: string
}): Promise<{ status: number; data?: unknown; rawText?: string }> {
  return tinyFetch(`/pedidos/${params.idPedido}/situacao`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ situacao: params.situacao }),
  }, params.token)
}
