'use client'

import { useEffect, useState } from 'react'
import AppLayout from '@/components/AppLayout'

interface TinySettings {
  apiToken: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function TinySettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [configured, setConfigured] = useState(false)
  const [settings, setSettings] = useState<TinySettings | null>(null)
  const [apiToken, setApiToken] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      const res = await fetch('/api/settings/tiny')
      const data = await res.json()
      
      if (res.ok) {
        setConfigured(data.configured)
        setSettings(data.settings)
        if (data.settings) {
          setApiToken(data.settings.apiToken)
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

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
        setConfigured(true)
        setSettings(data.settings)
        setApiToken('')
        setTimeout(() => setMessage(null), 5000)
      } else {
        setMessage({ type: 'error', text: data.error || 'Erro ao salvar token' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao salvar token' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="text-center py-12">Carregando...</div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Integração Tiny ERP</h1>
          <p className="mt-2 text-gray-600">
            Configure o Token API do Tiny ERP
          </p>
        </div>

        {message && (
          <div
            className={`rounded-lg p-4 ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="apiToken" className="block text-sm font-medium text-gray-700 mb-1">
                Token API
              </label>
              <input
                type="password"
                id="apiToken"
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={configured ? '••••••••••••••••' : 'seu-token-api'}
                required={!configured}
              />
              {configured && (
                <p className="text-xs text-gray-500 mt-1">
                  Deixe em branco para manter o token atual
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Salvando...' : configured ? 'Atualizar Token' : 'Salvar Token'}
            </button>
          </form>
        </div>

        {configured && settings && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex gap-3">
              <span className="text-green-600">✓</span>
              <div>
                <h4 className="text-sm font-medium text-green-900 mb-1">
                  Integração configurada
                </h4>
                <p className="text-sm text-green-700">
                  Token configurado: <code className="bg-green-100 px-1 rounded">••••••••</code>
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Última atualização: {new Date(settings.updatedAt).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex gap-3">
            <span className="text-blue-600">ℹ️</span>
            <div>
              <h4 className="text-sm font-medium text-blue-900 mb-1">
                Como obter o Token API
              </h4>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Acesse o painel do Tiny ERP</li>
                <li>Vá em Menu → Configurações → E-commerce</li>
                <li>Clique em "Token API"</li>
                <li>Copie o token exibido</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
