'use client'

import { useState } from 'react'
import AppLayout from '@/components/AppLayout'

export default function RetiradaPage() {
  return (
    <AppLayout>
      <RetiradaContent />
    </AppLayout>
  )
}

function RetiradaContent() {
  const [orderNumber, setOrderNumber] = useState('')
  const [cpf, setCpf] = useState('')
  const [operator, setOperator] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult('')

    try {
      const res = await fetch('/api/pickups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber,
          cpf,
          operator: operator.trim() ? operator : undefined,
        }),
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
          <h1 className="text-2xl font-semibold">Expedição - Retirada</h1>
          <p className="text-sm text-zinc-600">
            Informe o <strong>número do pedido</strong> (Tiny) e o <strong>CPF</strong> de quem está retirando.
          </p>
          <div className="flex gap-2">
            <a
              href="/api/tiny/auth?next=/expedicao/retirada"
              className="inline-flex h-10 items-center justify-center rounded-lg border bg-white px-3 text-sm font-medium"
            >
              Conectar Tiny
            </a>
            <a
              href="/dashboard"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-black px-3 text-sm font-medium text-white"
            >
              Voltar
            </a>
          </div>
        </header>

        <form onSubmit={onSubmit} className="space-y-4 rounded-xl border bg-white p-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Número do pedido (Tiny)</label>
            <input
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              inputMode="numeric"
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Ex: 12345"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">CPF do retirante</label>
            <input
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              inputMode="numeric"
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Ex: 123.456.789-00"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Operador (opcional)</label>
            <input
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Ex: João"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-black px-4 text-white disabled:opacity-60"
          >
            {loading ? 'Confirmando...' : 'Confirmar retirada'}
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
