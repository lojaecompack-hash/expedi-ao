import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

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

    // Buscar configurações da Tiny
    const settings = await prisma.tinySettings.findFirst({
      where: { isActive: true }
    })

    if (!settings) {
      return NextResponse.json({ ok: false, error: 'Configurações da Tiny não encontradas' }, { status: 404 })
    }

    // Descriptografar token
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'),
      Buffer.from(process.env.ENCRYPTION_IV!, 'hex')
    )
    let token = decipher.update(settings.apiTokenEncrypted, 'hex', 'utf8')
    token += decipher.final('utf8')

    // Buscar produtos na Tiny
    const tinyUrl = `https://api.tiny.com.br/api2/produtos.pesquisa.php`
    const params = new URLSearchParams({
      token,
      pesquisa,
      formato: 'json'
    })

    const response = await fetch(`${tinyUrl}?${params}`)
    const data = await response.json()

    if (data.retorno.status === 'OK' && data.retorno.produtos) {
      const produtos = data.retorno.produtos.map((item: any) => ({
        id: item.produto.id,
        codigo: item.produto.codigo,
        nome: item.produto.nome,
        unidade: item.produto.unidade,
        preco: item.produto.preco
      }))

      return NextResponse.json({ ok: true, produtos })
    }

    return NextResponse.json({ ok: true, produtos: [] })
  } catch (error) {
    console.error('Erro ao buscar produtos:', error)
    return NextResponse.json({ ok: false, error: 'Erro ao buscar produtos' }, { status: 500 })
  }
}
