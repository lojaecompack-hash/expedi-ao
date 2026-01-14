import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTinyAccessToken } from '@/lib/tiny-oauth'

export async function GET() {
  const steps: string[] = []
  
  try {
    // Passo 1: Testar conexão com banco
    steps.push('1. Testando conexão com banco...')
    await prisma.$queryRaw`SELECT 1`
    steps.push('✅ Conexão com banco OK')
    
    // Passo 2: Verificar se workspace existe
    steps.push('2. Verificando workspace...')
    const workspace = await prisma.workspace.findFirst({
      where: { name: 'Default' },
      include: { tinySettings: true }
    })
    steps.push(`✅ Workspace: ${workspace ? 'Encontrado' : 'NÃO ENCONTRADO'}`)
    
    if (!workspace) {
      return NextResponse.json({ ok: false, error: 'Workspace não encontrado', steps })
    }
    
    // Passo 3: Verificar se TinySettings existe
    steps.push('3. Verificando TinySettings...')
    steps.push(`✅ TinySettings: ${workspace.tinySettings ? 'Configurado' : 'NÃO CONFIGURADO'}`)
    
    if (!workspace.tinySettings) {
      return NextResponse.json({ ok: false, error: 'TinySettings não configurado', steps })
    }
    
    // Passo 4: Testar OAuth
    steps.push('4. Testando OAuth com Tiny...')
    const token = await getTinyAccessToken()
    steps.push(`✅ Token OAuth obtido: ${token.substring(0, 20)}...`)
    
    // Passo 5: Testar API do Tiny
    steps.push('5. Testando chamada à API do Tiny...')
    const response = await fetch('https://erp.tiny.com.br/public-api/v3/pedidos?limit=1', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    })
    steps.push(`✅ API Tiny respondeu: ${response.status}`)
    
    if (!response.ok) {
      const text = await response.text()
      steps.push(`❌ Erro da API Tiny: ${text}`)
      return NextResponse.json({ ok: false, error: 'API Tiny falhou', steps, tinyResponse: text })
    }
    
    const data = await response.json()
    steps.push(`✅ Dados recebidos do Tiny`)
    
    return NextResponse.json({
      ok: true,
      message: 'Todos os testes passaram!',
      steps,
      tinyData: data
    })
    
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const stack = error instanceof Error ? error.stack : undefined
    
    steps.push(`❌ ERRO: ${message}`)
    
    return NextResponse.json({
      ok: false,
      error: message,
      stack,
      steps
    }, { status: 500 })
  }
}
