import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST - Fazer match de nome de transportadora
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { nomeTransportador } = body

    if (!nomeTransportador) {
      return NextResponse.json({ ok: true, match: null, nomeDisplay: 'Não definida' })
    }

    const nomeUpper = nomeTransportador.toUpperCase().trim()

    // Buscar todas as transportadoras ativas
    const transportadoras = await prisma.transportadora.findMany({
      where: { isActive: true }
    })

    // Tentar match exato primeiro
    let matched = transportadoras.find(t => t.nome === nomeUpper)

    // Se não encontrou, tentar match por alias
    if (!matched) {
      for (const t of transportadoras) {
        const aliasesUpper = t.aliases.map(a => a.toUpperCase().trim())
        if (aliasesUpper.includes(nomeUpper)) {
          matched = t
          break
        }
      }
    }

    // Se não encontrou, tentar match parcial (contém)
    if (!matched) {
      for (const t of transportadoras) {
        if (nomeUpper.includes(t.nome) || t.nome.includes(nomeUpper)) {
          matched = t
          break
        }
        // Verificar aliases parciais
        for (const alias of t.aliases) {
          const aliasUpper = alias.toUpperCase().trim()
          if (nomeUpper.includes(aliasUpper) || aliasUpper.includes(nomeUpper)) {
            matched = t
            break
          }
        }
        if (matched) break
      }
    }

    if (matched) {
      return NextResponse.json({
        ok: true,
        match: matched,
        nomeDisplay: matched.nomeDisplay || matched.nome
      })
    }

    // Não encontrou match - retornar o nome original
    return NextResponse.json({
      ok: true,
      match: null,
      nomeDisplay: nomeTransportador
    })
  } catch (error) {
    console.error('[Transportadoras Match] Erro:', error)
    return NextResponse.json({ ok: false, error: 'Erro ao fazer match' }, { status: 500 })
  }
}
