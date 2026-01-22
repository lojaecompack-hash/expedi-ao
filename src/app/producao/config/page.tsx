'use client'

import { useState, useEffect } from 'react'
import MainLayout from '@/components/MainLayout'
import { Settings, Save, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Machine {
  id: string
  code: string
  name: string
  isActive: boolean
}

export default function ProducaoConfigPage() {
  const [machines, setMachines] = useState<Machine[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchMachines()
  }, [])

  const fetchMachines = async () => {
    try {
      const res = await fetch('/api/production/machines/config')
      const data = await res.json()
      if (data.ok) {
        setMachines(data.machines)
      }
    } catch (error) {
      console.error('Erro ao buscar máquinas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleMachine = (machineId: string) => {
    setMachines(machines.map(m => 
      m.id === machineId ? { ...m, isActive: !m.isActive } : m
    ))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/production/machines/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ machines })
      })
      const data = await res.json()
      if (data.ok) {
        alert('Configurações salvas com sucesso!')
      } else {
        alert(data.error || 'Erro ao salvar configurações')
      }
    } catch (error) {
      console.error('Erro ao salvar:', error)
      alert('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-zinc-500">Carregando...</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/producao"
              className="w-10 h-10 bg-zinc-100 hover:bg-zinc-200 rounded-xl flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-10 h-10 bg-[#FFD700] rounded-xl flex items-center justify-center">
              <Settings className="w-6 h-6 text-zinc-900" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">Configurações de Produção</h1>
              <p className="text-zinc-500">Gerencie as máquinas e configurações do sistema</p>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-[#FFD700] hover:bg-[#E6C200] text-zinc-900 rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="p-6 border-b border-zinc-200">
            <h2 className="text-lg font-semibold text-zinc-900">Máquinas de Corte e Solda</h2>
            <p className="text-sm text-zinc-500 mt-1">Ative ou desative máquinas conforme necessário</p>
          </div>

          <div className="divide-y divide-zinc-200">
            {machines.map((machine) => (
              <div key={machine.id} className="p-6 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center">
                    <span className="font-bold text-zinc-900">{machine.code}</span>
                  </div>
                  <div>
                    <div className="font-medium text-zinc-900">{machine.name}</div>
                    <div className="text-sm text-zinc-500">Máquina de Corte e Solda</div>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleMachine(machine.id)}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    machine.isActive ? 'bg-green-500' : 'bg-zinc-300'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      machine.isActive ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex gap-3">
            <div className="text-blue-600 text-xl">ℹ️</div>
            <div>
              <div className="font-medium text-blue-900">Informação</div>
              <div className="text-sm text-blue-700 mt-1">
                Máquinas desativadas não aparecerão na tela principal de produção. 
                Use esta opção para manutenção ou quando a máquina estiver fora de operação.
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
