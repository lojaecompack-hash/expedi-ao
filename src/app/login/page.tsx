'use client'

import { useEffect, useMemo, useState } from 'react'

import { createSupabaseBrowserClient } from '@/lib/supabase/browser'

export default function LoginPage() {
  const [nextPath, setNextPath] = useState('/dashboard')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  useEffect(() => {
    const url = new URL(window.location.href)
    const next = url.searchParams.get('next')
    if (next && next.startsWith('/')) {
      setNextPath(next)
    }
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (signInError) {
        setError(signInError.message)
        return
      }

      window.location.href = nextPath
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-6 text-zinc-900">
      <div className="mx-auto w-full max-w-md space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">Entrar</h1>
          <p className="text-sm text-zinc-600">Entre com seu e-mail e senha para continuar.</p>
        </header>

        <section className="rounded-xl border bg-white p-4 space-y-4">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">E-mail</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                className="w-full rounded-lg border px-3 py-2"
                placeholder="seuemail@exemplo.com"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Senha</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="current-password"
                className="w-full rounded-lg border px-3 py-2"
                placeholder="••••••••"
              />
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-black px-3 text-sm font-medium text-white disabled:opacity-60"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </section>

        <footer className="text-xs text-zinc-500">
          Se você ainda não tiver um usuário, crie no Supabase Auth (Users) ou me peça que eu te guie.
        </footer>
      </div>
    </div>
  )
}
