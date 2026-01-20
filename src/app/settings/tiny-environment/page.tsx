'use client'

import { useState, useEffect } from 'react'
import MainLayout from '@/components/MainLayout'

interface EnvironmentConfig {
  environment: string
  hasTestToken: boolean
  hasProductionToken: boolean
}

export default function TinyEnvironmentPage() {
  const [config, setConfig] = useState<EnvironmentConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testToken, setTestToken] = useState('')
  const [showTestTokenInput, setShowTestTokenInput] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const res = await fetch('/api/settings/tiny-environment')
      if (res.ok) {
        const data = await res.json()
        setConfig(data)
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error)
    } finally {
      setLoading(false)
    }
  }

  const switchEnvironment = async (env: string) => {
    if (env === 'test' && !config?.hasTestToken) {
      setMessage('Configure o token de teste primeiro!')
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const res = await fetch('/api/settings/tiny-environment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ environment: env })
      })

      if (res.ok) {
        const data = await res.json()
        setMessage(data.message)
        await loadConfig()
      } else {
        setMessage('Erro ao alternar ambiente')
      }
    } catch (error) {
      console.error('Erro:', error)
      setMessage('Erro ao alternar ambiente')
    } finally {
      setSaving(false)
    }
  }

  const saveTestToken = async () => {
    if (!testToken.trim()) {
      setMessage('Digite o token de teste')
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const res = await fetch('/api/settings/tiny-environment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testToken: testToken.trim() })
      })

      if (res.ok) {
        setMessage('Token de teste salvo com sucesso!')
        setTestToken('')
        setShowTestTokenInput(false)
        await loadConfig()
      } else {
        setMessage('Erro ao salvar token de teste')
      }
    } catch (error) {
      console.error('Erro:', error)
      setMessage('Erro ao salvar token de teste')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="p-6">Carregando...</div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Ambiente Tiny API</h1>

        {message && (
          <div className={`mb-4 p-4 rounded ${message.includes('Erro') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
            {message}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Ambiente Atual</h2>
          
          <div className="flex items-center gap-4 mb-6">
            <div className={`px-6 py-3 rounded-lg font-bold text-lg ${
              config?.environment === 'production' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {config?.environment === 'production' ? '🟢 PRODUÇÃO' : '🟡 TESTE'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => switchEnvironment('production')}
              disabled={saving || config?.environment === 'production'}
              className={`p-4 rounded-lg border-2 transition ${
                config?.environment === 'production'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 hover:border-green-500 hover:bg-green-50'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="font-semibold text-lg mb-2">🟢 Produção</div>
              <div className="text-sm text-gray-600">
                {config?.hasProductionToken ? 'Token configurado ✓' : 'Token não configurado'}
              </div>
            </button>

            <button
              onClick={() => switchEnvironment('test')}
              disabled={saving || config?.environment === 'test' || !config?.hasTestToken}
              className={`p-4 rounded-lg border-2 transition ${
                config?.environment === 'test'
                  ? 'border-yellow-500 bg-yellow-50'
                  : 'border-gray-300 hover:border-yellow-500 hover:bg-yellow-50'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="font-semibold text-lg mb-2">🟡 Teste</div>
              <div className="text-sm text-gray-600">
                {config?.hasTestToken ? 'Token configurado ✓' : 'Token não configurado'}
              </div>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Configurar Token de Teste</h2>
          
          {!showTestTokenInput ? (
            <button
              onClick={() => setShowTestTokenInput(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {config?.hasTestToken ? 'Atualizar Token de Teste' : 'Adicionar Token de Teste'}
            </button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Token da API Tiny (Teste)</label>
                <input
                  type="text"
                  value={testToken}
                  onChange={(e) => setTestToken(e.target.value)}
                  placeholder="Cole o token de teste aqui"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={saveTestToken}
                  disabled={saving}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
                <button
                  onClick={() => {
                    setShowTestTokenInput(false)
                    setTestToken('')
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">ℹ️ Como usar:</h3>
          <ul className="text-sm space-y-1 text-gray-700">
            <li>• <strong>Produção:</strong> Usa o token configurado em /settings/integrations/tiny</li>
            <li>• <strong>Teste:</strong> Usa o token de teste da Tiny (sandbox)</li>
            <li>• Alterne entre ambientes conforme necessário</li>
            <li>• Todas as chamadas à API Tiny usarão o token do ambiente ativo</li>
          </ul>
        </div>
      </div>
    </MainLayout>
  )
}
