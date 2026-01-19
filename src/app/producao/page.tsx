'use client'

import { useState, useEffect } from 'react'
import MainLayout from '@/components/MainLayout'
import { Factory, Plus, Pause, Play, Settings } from 'lucide-react'
import Link from 'next/link'

interface MachineStatus {
  id: string
  code: string
  name: string
  status: 'LIVRE' | 'ATIVA' | 'PARADA'
  currentOrder: {
    id: string
    code: string
    productName: string
    productMeasure: string
    pesoTotalProduzido: number
    bobinaPesoInicial: number
    totalApara: number
  } | null
  currentSession: {
    id: string
    operatorName: string
    turno: string
    inicioAt: string
  } | null
  currentParada: {
    id: string
    tipo: string
    motivo: string
    inicioAt: string
  } | null
}

const turnoAtual = (): string => {
  const hora = new Date().getHours()
  if (hora >= 6 && hora < 14) return 'MANHA'
  if (hora >= 14 && hora < 22) return 'TARDE'
  return 'NOITE'
}

const turnoLabel = (turno: string) => {
  const labels: Record<string, string> = {
    'MANHA': 'Manhã',
    'TARDE': 'Tarde',
    'NOITE': 'Noite'
  }
  return labels[turno] || turno
}

const paradaLabel = (tipo: string) => {
  const labels: Record<string, string> = {
    'ALMOCO': '🍽️ Almoço',
    'MANUTENCAO': '🔧 Manutenção',
    'BANHEIRO': '🚽 Banheiro',
    'SETUP': '⚙️ Setup',
    'FALTA_BOBINA': '📦 Falta Bobina',
    'OUTROS': '❓ Outros'
  }
  return labels[tipo] || tipo
}

export default function ProducaoPage() {
  const [machines, setMachines] = useState<MachineStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [turno, setTurno] = useState(turnoAtual())

  useEffect(() => {
    fetchMachines()
    const interval = setInterval(fetchMachines, 30000) // Atualiza a cada 30s
    return () => clearInterval(interval)
  }, [])

  const fetchMachines = async () => {
    try {
      const res = await fetch('/api/production/machines')
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

  const calcularProgresso = (machine: MachineStatus) => {
    if (!machine.currentOrder) return 0
    const { pesoTotalProduzido, bobinaPesoInicial, totalApara } = machine.currentOrder
    const usado = Number(pesoTotalProduzido) + Number(totalApara)
    return Math.min(100, Math.round((usado / Number(bobinaPesoInicial)) * 100))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ATIVA': return 'bg-green-500'
      case 'PARADA': return 'bg-yellow-500'
      default: return 'bg-zinc-300'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ATIVA': return <Play className="w-4 h-4" />
      case 'PARADA': return <Pause className="w-4 h-4" />
      default: return <Plus className="w-4 h-4" />
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

  // Resumo do turno
  const maquinasAtivas = machines.filter(m => m.status === 'ATIVA').length
  const maquinasParadas = machines.filter(m => m.status === 'PARADA').length
  const totalProduzido = machines.reduce((acc, m) => {
    return acc + (m.currentOrder ? Number(m.currentOrder.pesoTotalProduzido) : 0)
  }, 0)
  const totalApara = machines.reduce((acc, m) => {
    return acc + (m.currentOrder ? Number(m.currentOrder.totalApara) : 0)
  }, 0)

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FFD700] rounded-xl flex items-center justify-center">
              <Factory className="w-6 h-6 text-zinc-900" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">Produção - Corte e Solda</h1>
              <p className="text-zinc-500">Gerencie as 10 máquinas de corte e solda</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <select
              value={turno}
              onChange={(e) => setTurno(e.target.value)}
              className="px-4 py-2 border border-zinc-300 rounded-lg bg-white"
            >
              <option value="MANHA">Turno: Manhã</option>
              <option value="TARDE">Turno: Tarde</option>
              <option value="NOITE">Turno: Noite</option>
            </select>

            <Link
              href="/producao/config"
              className="flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
              Configurações
            </Link>
          </div>
        </div>

        {/* Resumo do Turno */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-zinc-200">
            <div className="text-sm text-zinc-500">Máquinas Ativas</div>
            <div className="text-2xl font-bold text-green-600">{maquinasAtivas}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-zinc-200">
            <div className="text-sm text-zinc-500">Máquinas Paradas</div>
            <div className="text-2xl font-bold text-yellow-600">{maquinasParadas}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-zinc-200">
            <div className="text-sm text-zinc-500">Peso Produzido</div>
            <div className="text-2xl font-bold text-zinc-900">{totalProduzido.toFixed(1)} kg</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-zinc-200">
            <div className="text-sm text-zinc-500">Apara Total</div>
            <div className="text-2xl font-bold text-red-600">{totalApara.toFixed(1)} kg</div>
          </div>
        </div>

        {/* Grid de Máquinas */}
        <div className="grid grid-cols-5 gap-4">
          {machines.map((machine) => (
            <Link
              key={machine.id}
              href={machine.status === 'LIVRE' 
                ? `/producao/nova-op?machine=${machine.id}` 
                : `/producao/op/${machine.currentOrder?.id}`}
              className="bg-white rounded-xl border border-zinc-200 p-4 hover:shadow-lg transition-shadow cursor-pointer"
            >
              {/* Header da Máquina */}
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-zinc-900">{machine.code}</span>
                <span className={`w-3 h-3 rounded-full ${getStatusColor(machine.status)}`} />
              </div>

              {/* Status */}
              <div className="flex items-center gap-2 mb-3">
                {getStatusIcon(machine.status)}
                <span className={`text-sm font-medium ${
                  machine.status === 'ATIVA' ? 'text-green-600' :
                  machine.status === 'PARADA' ? 'text-yellow-600' :
                  'text-zinc-500'
                }`}>
                  {machine.status === 'ATIVA' ? 'Ativa' :
                   machine.status === 'PARADA' ? 'Parada' : 'Livre'}
                </span>
              </div>

              {/* Conteúdo baseado no status */}
              {machine.status === 'LIVRE' && (
                <div className="text-center py-4">
                  <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Plus className="w-5 h-5 text-zinc-400" />
                  </div>
                  <span className="text-sm text-zinc-400">Iniciar OP</span>
                </div>
              )}

              {machine.status === 'PARADA' && machine.currentParada && (
                <div className="space-y-2">
                  <div className="text-sm text-yellow-600 font-medium">
                    {paradaLabel(machine.currentParada.tipo)}
                  </div>
                  {machine.currentOrder && (
                    <div className="text-xs text-zinc-500">
                      {machine.currentOrder.productMeasure}
                    </div>
                  )}
                </div>
              )}

              {machine.status === 'ATIVA' && machine.currentOrder && (
                <div className="space-y-2">
                  <div className="text-lg font-bold text-zinc-900">
                    {machine.currentOrder.productMeasure}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {machine.currentSession?.operatorName}
                  </div>
                  
                  {/* Barra de Progresso */}
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-zinc-500 mb-1">
                      <span>{Number(machine.currentOrder.pesoTotalProduzido).toFixed(1)}kg</span>
                      <span>{Number(machine.currentOrder.bobinaPesoInicial).toFixed(1)}kg</span>
                    </div>
                    <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${calcularProgresso(machine)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </Link>
          ))}
        </div>

        {/* Ações Rápidas */}
        <div className="flex gap-4">
          <Link
            href="/producao/etiquetas"
            className="flex-1 bg-[#FFD700] hover:bg-[#E6C200] text-zinc-900 py-4 rounded-xl font-medium text-center transition-colors"
          >
            🖨️ Estação de Etiquetas
          </Link>
          <Link
            href="/producao/conferencia"
            className="flex-1 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-900 py-4 rounded-xl font-medium text-center transition-colors"
          >
            ✅ OPs Aguardando Conferência
          </Link>
        </div>
      </div>
    </MainLayout>
  )
}
