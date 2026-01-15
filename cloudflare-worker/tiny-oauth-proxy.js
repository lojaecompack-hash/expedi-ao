// Cloudflare Worker para fazer proxy do OAuth do Tiny ERP
// Deploy em: https://workers.cloudflare.com/

export default {
  async fetch(request, env) {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    // Only allow POST
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    try {
      const { clientId, clientSecret } = await request.json()

      if (!clientId || !clientSecret) {
        return new Response(JSON.stringify({ 
          error: 'clientId e clientSecret são obrigatórios' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Fazer requisição OAuth para o Tiny
      const params = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      })

      // Usar IP direto para contornar erro 1016 do Cloudflare
      const response = await fetch('https://177.67.82.107/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Cloudflare-Worker/1.0',
          'Accept': 'application/json',
          'Host': 'auth.tiny.com.br',
        },
        body: params.toString(),
      })

      // Tentar parsear como JSON, se falhar retornar o texto
      let data
      const contentType = response.headers.get('content-type')
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        const text = await response.text()
        return new Response(JSON.stringify({
          error: 'Resposta não é JSON',
          status: response.status,
          contentType,
          body: text.substring(0, 500)
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      if (!response.ok) {
        return new Response(JSON.stringify({
          error: 'Tiny OAuth falhou',
          status: response.status,
          details: data
        }), {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })

    } catch (error) {
      return new Response(JSON.stringify({
        error: error.message || 'Erro desconhecido'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
  }
}
