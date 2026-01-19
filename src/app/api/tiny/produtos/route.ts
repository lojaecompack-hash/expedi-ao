import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getTinyApiToken } from '@/lib/tiny-api'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const pesquisa = searchParams.get('pesquisa')

    if (!pesquisa || pesquisa.length < 2) {
      return NextResponse.json({ ok: false, error: 'Pesquisa deve ter pelo menos 2 caracteres' }, { status: 400 })
    }

    // Buscar token usando a mesma função do módulo de retirada
    let token: string
    try {
      token = await getTinyApiToken()
    } catch (error) {
      console.error('Erro ao obter token Tiny:', error)
      return NextResponse.json({ 
        ok: false, 
        error: 'Configure a integração com a Tiny primeiro em /setup/tiny',
        produtos: [] 
      })
    }

    // Buscar produtos na Tiny
    const tinyUrl = `https://api.tiny.com.br/api2/produtos.pesquisa.php`
    const params = new URLSearchParams({
      token,
      pesquisa,
      formato: 'json'
    })

    const response = await fetch(`${tinyUrl}?${params}`)
    const data = await response.json()

    console.log('Tiny API Response:', JSON.stringify(data, null, 2))

    if (data.retorno?.status === 'OK' && data.retorno?.produtos) {
      const produtos = data.retorno.produtos.map((item: { produto: { id: string; codigo: string; nome: string; unidade: string; preco: string } }) => ({
        id: item.produto.id,
        codigo: item.produto.codigo,
        nome: item.produto.nome,
        unidade: item.produto.unidade,
        preco: item.produto.preco
      }))

      return NextResponse.json({ ok: true, produtos })
    }

    // Se não encontrou produtos ou houve erro
    if (data.retorno?.status === 'Erro') {
      console.error('Erro da Tiny API:', data.retorno)
      return NextResponse.json({ 
        ok: false, 
        error: data.retorno.erros?.[0]?.erro || 'Erro ao buscar produtos na Tiny',
        produtos: [] 
      })
    }

    return NextResponse.json({ ok: true, produtos: [] })
  } catch (error) {
    console.error('Erro ao buscar produtos:', error)
    return NextResponse.json({ ok: false, error: 'Erro ao buscar produtos' }, { status: 500 })
  }
}
