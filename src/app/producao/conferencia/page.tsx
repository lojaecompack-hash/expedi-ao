'use client'

import { useState, useEffect } from 'react'
import MainLayout from '@/components/MainLayout'
import { ArrowLeft, CheckCircle, AlertTriangle, Sun, Sunset, Moon } from 'lucide-react'
import Link from 'next/link'

interface ProductionOrder {
  id: string
  code: string
  productSku: string
  productName: string
  productMeasure: string
  pesoTotalProduzido: number
  totalApara: number
  totalPacotes: number
  totalUnidades: number
  turnoInicial: string
  finishedAt: string
  sessoes: Array<{
    operatorName: string
    machine: { code: string }
  }>
}

interface GroupedOrders {
  [turno: string]: ProductionOrder[]
}

export default function ConferenciaPage() {
  const [groupedOrders, setGroupedOrders] = useState<GroupedOrders>({})
  const [loading, setLoading] = useState(true)
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [conferindo, setConferindo] = useState(false)
  const [confValues, setConfValues] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/production/conferencia')
      const data = await res.json()
      if (data.ok) {
        const grouped: GroupedOrders = data.groupedByTurno || {}
        setGroupedOrders(grouped)
        const initialValues: Record<string, string> = {}
        for (const turno of Object.keys(grouped)) {
          for (const order of grouped[turno]) {
            initialValues[order.id] = String(order.totalPacotes)
          }
        }
        setConfValues(initialValues)
      }
    } catch (error) {
      console.error('Erro ao buscar ordens:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleOrder = (orderId: string) => {
    const newSelected = new Set(selectedOrders)
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId)
    } else {
      newSelected.add(orderId)
    }
    setSelectedOrders(newSelected)
  }

  const toggleAllTurno = (turno: string) => {
    const turnoOrders = groupedOrders[turno] || []
    const allSelected = turnoOrders.every(o => selectedOrders.has(o.id))
    const newSelected = new Set(selectedOrders)
    if (allSelected) {
      turnoOrders.forEach(o => newSelected.delete(o.id))
    } else {
      turnoOrders.forEach(o => newSelected.add(o.id))
    }
    setSelectedOrders(newSelected)
  }

  const handleConferirSelecionadas = async () => {
    if (selectedOrders.size === 0) {
      alert('Selecione pelo menos uma ordem para conferir')
      return
    }
    setConferindo(true)
    try {
      const allOrders: ProductionOrder[] = []
      for (const turno of Object.keys(groupedOrders)) {
        allOrders.push(...groupedOrders[turno])
      }
      const ordersToConfer = allOrders.filter(o => selectedOrders.has(o.id))
      for (const order of ordersToConfer) {
        const pacotesConferido = parseInt(confValues[order.id] || String(order.totalPacotes))
        const res = await fetch('/api/production/conferencia', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: order.id,
            pesoConferido: order.pesoTotalProduzido,
            unidadesConferido: pacotesConferido,
            pacotesConferido: pacotesConferido,
            observacao: ''
          })
        })
        const data = await res.json()
        if (!data.ok) {
          alert('Erro ao conferir ' + order.code + ': ' + data.error)
          break
        }
      }
      alert(ordersToConfer.length + ' ordem(ns) conferida(s) com sucesso!')
      setSelectedOrders(new Set())
      fetchOrders()
    } catch (error) {
      console.error('Erro ao conferir:', error)
      alert('Erro ao conferir ordens')
    } finally {
      setConferindo(false)
    }
  }

  const getTurnoIcon = (turno: string) => {
    switch (turno) {
      case 'MANHA': return <Sun className="w-5 h-5 text-yellow-500" />
      case 'TARDE': return <Sunset className="w-5 h-5 text-orange-500" />
      case 'NOITE': return <Moon className="w-5 h-5 text-blue-500" />
      default: return null
    }
  }

  const getTurnoLabel = (turno: string) => {
    switch (turno) {
      case 'MANHA': return 'Manha'
      case 'TARDE': return 'Tarde'
      case 'NOITE': return 'Noite'
      default: return turno
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

  const totalOrders = Object.values(groupedOrders).flat().length

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/producao" className="p-2 hover:bg-zinc-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Conferencia de Producao</h1>
            <p className="text-zinc-500">Confira as ordens por turno - {totalOrders} OPs aguardando</p>
          </div>
        </div>

        {totalOrders === 0 ? (
          <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-zinc-300" />
            <p className="text-zinc-500">Nenhuma ordem aguardando conferencia</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedOrders).map(([turno, orders]) => {
              const allSelected = orders.every(o => selectedOrders.has(o.id))
              return (
                <div key={turno} className="bg-white rounded-xl border border-zinc-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getTurnoIcon(turno)}
                      <h2 className="text-lg font-semibold text-zinc-900">
                        Turno {getTurnoLabel(turno)} ({orders.length} OPs)
                      </h2>
                    </div>
                    <button
                      onClick={() => toggleAllTurno(turno)}
                      className="px-4 py-2 text-sm bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
                    >
                      {allSelected ? 'Desmarcar Todas' : 'Selecionar Todas'}
                    </button>
                  </div>
                  <div className="space-y-3">
                    {orders.map((order) => {
                      const isSelected = selectedOrders.has(order.id)
                      const hasDivergencia = parseInt(confValues[order.id] || '0') !== order.totalPacotes
                      return (
                        <div
                          key={order.id}
                          className={'p-4 rounded-xl border-2 transition-colors ' + (isSelected ? 'border-[#FFD700] bg-yellow-50' : 'border-zinc-200')}
                        >
                          <div className="flex items-start gap-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleOrder(order.id)}
                              className="mt-1 w-5 h-5 rounded border-zinc-300"
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-zinc-900">{order.code}</span>
                                <span className="text-sm text-zinc-500">
                                  {new Date(order.finishedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div className="text-sm text-zinc-600 mb-2">
                                {order.productMeasure} - {order.productName}
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-sm">
                                  <span className="text-zinc-500">Informado: </span>
                                  <strong>{order.totalPacotes} pacotes</strong>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-zinc-500">Conferido:</span>
                                  <input
                                    type="number"
                                    value={confValues[order.id] || ''}
                                    onChange={(e) => setConfValues({ ...confValues, [order.id]: e.target.value })}
                                    className="w-20 px-2 py-1 text-sm border border-zinc-300 rounded"
                                  />
                                </div>
                                {hasDivergencia && (
                                  <div className="flex items-center gap-1 text-yellow-600">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span className="text-xs">Divergencia</span>
                                  </div>
                                )}
                              </div>
                              {order.sessoes[0] && (
                                <div className="text-xs text-zinc-400 mt-2">
                                  {order.sessoes[0].machine?.code} - {order.sessoes[0].operatorName}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
            {selectedOrders.size > 0 && (
              <div className="fixed bottom-6 right-6 bg-white rounded-xl border-2 border-[#FFD700] shadow-2xl p-6">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="text-sm text-zinc-500">Selecionadas</div>
                    <div className="text-2xl font-bold text-zinc-900">{selectedOrders.size} OPs</div>
                  </div>
                  <button
                    onClick={handleConferirSelecionadas}
                    disabled={conferindo}
                    className="px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-zinc-300 text-white rounded-lg font-medium flex items-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    {conferindo ? 'Conferindo...' : 'Conferir Selecionadas'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  )
}
