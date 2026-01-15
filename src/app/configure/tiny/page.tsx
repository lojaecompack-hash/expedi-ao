'use client'

import { useState } from 'react'

export default function ConfigureTinyPage() {
  const [apiToken, setApiToken] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    setSaving(true)

    try {
      const res = await fetch('/api/settings/tiny', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiToken }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({ type: 'success', text: 'Token API salvo com sucesso!' })
        setApiToken('')
        setTimeout(() => {
          window.location.href = '/expedicao/retirada'
        }, 2000)
      } else {
        setMessage({ type: 'error', text: data.error || 'Erro ao salvar token' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao salvar token' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Configurar Tiny ERP
          </h1>
          <p className="text-gray-600">
            Cole seu Token API do Tiny ERP
          </p>
        </div>

        {message && (
          <div
            className={`rounded-lg p-4 mb-6 ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="apiToken" className="block text-sm font-medium text-gray-700 mb-2">
              Token API
            </label>
            <textarea
              id="apiToken"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Cole seu Token API aqui..."
              rows={4}
              required
            />
            <p className="text-xs text-gray-500 mt-2">
              Menu → Configurações → E-commerce → Token API
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {saving ? 'Salvando...' : 'Salvar Token API'}
          </button>
        </form>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            Como obter o Token API:
          </h4>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Acesse o painel do Tiny ERP</li>
            <li>Menu → Configurações → E-commerce</li>
            <li>Clique em "Token API"</li>
            <li>Copie o token exibido</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
