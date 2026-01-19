'use client'

import { useState, useEffect } from 'react'
import MainLayout from '@/components/MainLayout'
import { ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react'
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
  finishedAt: string
  sessoes: Array<{
    operatorName: string
    machine: { code: string }
  }>
}

export default function ConferenciaPage() {
  const [orders, setOrders] = useState<ProductionOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null)
  const [conferindo, setConferindo] = useState(false)

  const [confForm, setConfForm] = useState({
    pesoConferido: '',
    unidadesConferido: '',
    pacotesConferido: '',
    observacao: ''
  })

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/production/conferencia')
      const data = await res.json()
      if (data.ok) {
        setOrders(data.orders)
      }
    } catch (error) {
      console.error('Erro ao buscar ordens:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectOrder = (order: ProductionOrder) => {
    setSelectedOrder(order)
    setConfForm({
      pesoConferido: String(order.pesoTotalProduzido),
      unidadesConferido: String(order.totalUnidades),
      pacotesConferido: String(order.totalPacotes),
      observacao: ''
    })
  }

  const handleConferir = async () => {
    if (!selectedOrder) return
    setConferindo(true)

    try {
      const res = await fetch('/api/production/conferencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          pesoConferido: parseFloat(confForm.pesoConferido),
          unidadesConferido: parseInt(confForm.unidadesConferido),
          pacotesConferido: parseInt(confForm.pacotesConferido),
          observacao: confForm.observacao
        })
      })

      const data = await res.json()

      if (data.ok) {
        if (data.divergencia) {
          alert('Conferência realizada com divergência! Os valores foram ajustados.')
        } else {
          alert('Conferência realizada com sucesso!')
        }
        setSelectedOrder(null)
        fetchOrders()
      } else {
        alert(data.error)
      }
    } catch (error) {
      console.error('Erro ao conferir:', error)
      alert('Erro ao conferir')
    } finally {
      setConferindo(false)
    }
  }

  const hasDivergencia = selectedOrder && (
    parseFloat(confForm.pesoConferido) !== Number(selectedOrder.pesoTotalProduzido) ||
    parseInt(confForm.unidadesConferido) !== selectedOrder.totalUnidades ||
    parseInt(confForm.pacotesConferido) !== selectedOrder.totalPacotes
  )

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
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/producao" className="p-2 hover:bg-zinc-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Conferência de Produção</h1>
            <p className="text-zinc-500">Confira as ordens de produção finalizadas</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Lista de OPs */}
          <div className="bg-white rounded-xl border border-zinc-200 p-6">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">
              OPs Aguardando Conferência ({orders.length})
            </h2>

            {orders.length === 0 ? (
              <div className="text-center py-8 text-zinc-400">
                Nenhuma ordem aguardando conferência
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => handleSelectOrder(order)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                      selectedOrder?.id === order.id
                        ? 'border-[#FFD700] bg-yellow-50'
                        : 'border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-zinc-900">{order.code}</span>
                      <span className="text-sm text-zinc-500">
                        {new Date(order.finishedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-sm text-zinc-600">
                      {order.productMeasure} - {order.productName}
                    </div>
                    <div className="flex gap-4 mt-2 text-sm">
                      <span className="text-zinc-500">
                        {order.totalPacotes} pacotes
                      </span>
                      <span className="text-zinc-500">
                        {Number(order.pesoTotalProduzido).toFixed(1)} kg
                      </span>
                    </div>
                    {order.sessoes[0] && (
                      <div className="text-xs text-zinc-400 mt-2">
                        {order.sessoes[0].machine?.code} - {order.sessoes[0].operatorName}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Formulário de Conferência */}
          <div className="bg-white rounded-xl border border-zinc-200 p-6">
            {!selectedOrder ? (
              <div className="text-center py-12 text-zinc-400">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                Selecione uma ordem para conferir
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900">
                    Conferindo: {selectedOrder.code}
                  </h2>
                  <p className="text-zinc-500">
                    {selectedOrder.productMeasure} - {selectedOrder.productName}
                  </p>
                </div>

                {/* Comparativo */}
                <div className="bg-zinc-50 rounded-xl p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-zinc-500 mb-2">INFORMADO (Operador)</div>
                      <div className="space-y-1">
                        <div>Pacotes: <strong>{selectedOrder.totalPacotes}</strong></div>
                        <div>Unidades: <strong>{selectedOrder.totalUnidades}</strong></div>
                        <div>Peso: <strong>{Number(selectedOrder.pesoTotalProduzido).toFixed(1)} kg</strong></div>
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-zinc-500 mb-2">CONFERIDO (Real)</div>
                      <div className="space-y-2">
                        <input
                          type="number"
                          value={confForm.pacotesConferido}
                          onChange={(e) => setConfForm({ ...confForm, pacotesConferido: e.target.value })}
                          className="w-full px-3 py-1 border border-zinc-300 rounded-lg text-sm"
                          placeholder="Pacotes"
                        />
                        <input
                          type="number"
                          value={confForm.unidadesConferido}
                          onChange={(e) => setConfForm({ ...confForm, unidadesConferido: e.target.value })}
                          className="w-full px-3 py-1 border border-zinc-300 rounded-lg text-sm"
                          placeholder="Unidades"
                        />
                        <input
                          type="number"
                          step="0.1"
                          value={confForm.pesoConferido}
                          onChange={(e) => setConfForm({ ...confForm, pesoConferido: e.target.value })}
                          className="w-full px-3 py-1 border border-zinc-300 rounded-lg text-sm"
                          placeholder="Peso (kg)"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Alerta de Divergência */}
                {hasDivergencia && (
                  <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <div className="text-sm text-yellow-800">
                      <strong>Divergência detectada!</strong> Os valores serão ajustados automaticamente.
                    </div>
                  </div>
                )}

                {/* Observação */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Observação (opcional)
                  </label>
                  <textarea
                    value={confForm.observacao}
                    onChange={(e) => setConfForm({ ...confForm, observacao: e.target.value })}
                    placeholder="Descreva qualquer observação relevante..."
                    className="w-full px-4 py-2 border border-zinc-300 rounded-lg resize-none h-24"
                  />
                </div>

                {/* Botões */}
                <div className="flex gap-4">
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="flex-1 px-4 py-3 bg-zinc-100 hover:bg-zinc-200 rounded-lg font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConferir}
                    disabled={conferindo}
                    className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 disabled:bg-zinc-300 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    {conferindo ? 'Conferindo...' : 'Aprovar e Ajustar'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
