'use client'

import { useState } from 'react'

export default function TinyTestPage() {
  const [idPedido, setIdPedido] = useState('')
  const [dryRun, setDryRun] = useState(true)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>('')

  async function listPedidos() {
    setLoading(true)
    setResult('')

    try {
      const res = await fetch('/api/tiny/pedidos?limit=20&offset=0')
      const text = await res.text()
      setResult(`HTTP ${res.status}\n\n${text}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      setResult(msg)
    } finally {
      setLoading(false)
    }
  }

  async function getPedido() {
    setLoading(true)
    setResult('')

    try {
      const id = Number(idPedido)
      if (!Number.isFinite(id) || id <= 0) {
        setResult('idPedido inválido')
        return
      }

      const res = await fetch(`/api/tiny/pedidos?idPedido=${encodeURIComponent(String(id))}`)
      const text = await res.text()
      setResult(`HTTP ${res.status}\n\n${text}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      setResult(msg)
    } finally {
      setLoading(false)
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult('')

    try {
      const id = Number(idPedido)
      if (!Number.isFinite(id) || id <= 0) {
        setResult('idPedido inválido')
        return
      }

      const res = await fetch('/api/tiny/mark-shipped', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idPedido: id, dryRun }),
      })

      const text = await res.text()
      setResult(`HTTP ${res.status}\n\n${text}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      setResult(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-6 text-zinc-900">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">Teste Tiny</h1>
          <p className="text-sm text-zinc-600">
            Esta tela chama o endpoint interno <code>/api/tiny/mark-shipped</code> para marcar o pedido como{' '}
            <strong>Enviada</strong> (situacao=5).
          </p>
          <div>
            <a
              href="/api/tiny/auth?next=/tiny-test"
              className="inline-flex h-10 items-center justify-center rounded-lg border bg-white px-3 text-sm font-medium"
            >
              Conectar Tiny (OAuth)
            </a>
          </div>
        </header>

        <form onSubmit={onSubmit} className="space-y-4 rounded-xl border bg-white p-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">ID do Pedido (Tiny)</label>
            <input
              value={idPedido}
              onChange={(e) => setIdPedido(e.target.value)}
              inputMode="numeric"
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Ex: 123"
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={loading}
              onClick={listPedidos}
              className="inline-flex h-11 items-center justify-center rounded-lg border bg-white px-4 text-sm disabled:opacity-60"
            >
              Listar pedidos (20)
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={getPedido}
              className="inline-flex h-11 items-center justify-center rounded-lg border bg-white px-4 text-sm disabled:opacity-60"
            >
              Buscar por ID
            </button>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              className="h-4 w-4"
            />
            Dry-run (não altera no Tiny)
          </label>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-black px-4 text-white disabled:opacity-60"
          >
            {loading ? 'Enviando...' : 'Executar'}
          </button>
        </form>

        <section className="space-y-2">
          <h2 className="text-sm font-medium text-zinc-700">Resultado</h2>
          <pre className="whitespace-pre-wrap rounded-xl border bg-white p-4 text-xs leading-5">
            {result || 'Sem resultado ainda.'}
          </pre>
        </section>
      </div>
    </div>
  )
}
