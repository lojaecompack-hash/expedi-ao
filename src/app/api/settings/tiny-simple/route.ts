import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { encrypt, decrypt } from '@/lib/crypto'

// Versão simplificada sem banco - apenas para testar criptografia
// TODO: Remover após resolver conexão com banco

let mockSettings: { clientId: string; clientSecretEncrypted: string } | null = null

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase.auth.getUser()

    if (!data.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    return NextResponse.json({
      configured: Boolean(mockSettings),
      settings: mockSettings
        ? {
            clientId: mockSettings.clientId,
            clientSecretDecrypted: decrypt(mockSettings.clientSecretEncrypted),
            isActive: true,
          }
        : null,
    })
  } catch (error) {
    console.error('Error in GET /api/settings/tiny-simple:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase.auth.getUser()

    if (!data.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await req.json()
    const { clientId, clientSecret } = body

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'clientId and clientSecret are required' },
        { status: 400 },
      )
    }

    // Criptografar e salvar em memória (temporário)
    const clientSecretEncrypted = encrypt(clientSecret)
    mockSettings = { clientId, clientSecretEncrypted }

    console.log('✅ Settings salvos (em memória):')
    console.log('  Client ID:', clientId)
    console.log('  Secret encrypted:', clientSecretEncrypted.substring(0, 50) + '...')
    console.log('  Secret decrypted:', decrypt(clientSecretEncrypted))

    return NextResponse.json({
      ok: true,
      settings: {
        clientId,
        isActive: true,
      },
      debug: {
        encrypted: clientSecretEncrypted.substring(0, 50) + '...',
        decrypted: decrypt(clientSecretEncrypted),
      },
    })
  } catch (error) {
    console.error('Error in POST /api/settings/tiny-simple:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
