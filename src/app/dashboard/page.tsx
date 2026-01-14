'use client'

import { useEffect, useState } from 'react'
import AppLayout from '@/components/AppLayout'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setTimeout(() => setLoading(false), 500)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 p-6 text-zinc-900">
        <div className="mx-auto w-full max-w-2xl">Carregando...</div>
      </div>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Bem-vindo ao sistema de expedição Tiny ERP
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">📦</span>
              <h3 className="text-lg font-semibold text-gray-900">Retiradas Hoje</h3>
            </div>
            <p className="text-3xl font-bold text-blue-600">0</p>
            <p className="text-sm text-gray-500 mt-1">Nenhuma retirada registrada</p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">📋</span>
              <h3 className="text-lg font-semibold text-gray-900">Esta Semana</h3>
            </div>
            <p className="text-3xl font-bold text-green-600">0</p>
            <p className="text-sm text-gray-500 mt-1">Total de retiradas</p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🔗</span>
              <h3 className="text-lg font-semibold text-gray-900">Tiny ERP</h3>
            </div>
            <p className="text-sm font-medium text-gray-600">Status: Não configurado</p>
            <p className="text-xs text-gray-500 mt-1">Configure em Settings</p>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
          <div className="flex gap-4">
            <a
              href="/expedicao/retirada"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              <span>📦</span>
              Nova Retirada
            </a>
            <a
              href="/expedicao/historico"
              className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
            >
              <span>📋</span>
              Ver Histórico
            </a>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
