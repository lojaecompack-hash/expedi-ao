'use client'

import { useState } from 'react'
import MainLayout from '@/components/MainLayout'
import { Printer, ArrowLeft, Search } from 'lucide-react'
import Link from 'next/link'

interface OrderForLabel {
  id: string
  code: string
  productName: string
  productMeasure: string
  quantity: number
  customerName: string
}

export default function ProducaoEtiquetasPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [orders, setOrders] = useState<OrderForLabel[]>([])
  const [loading, setLoading] = useState(false)
  const [printing, setPrinting] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!searchTerm.trim()) return

    setLoading(true)
    try {
      const res = await fetch(`/api/production/orders/search?q=${encodeURIComponent(searchTerm)}`)
      const data = await res.json()
      if (data.ok) {
        setOrders(data.orders)
      } else {
        alert(data.error || 'Erro ao buscar pedidos')
      }
    } catch (error) {
      console.error('Erro ao buscar:', error)
      alert('Erro ao buscar pedidos')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = async (orderId: string) => {
    setPrinting(orderId)
    try {
      const res = await fetch('/api/production/labels/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      })
      const data = await res.json()
      if (data.ok) {
        alert('Etiqueta enviada para impressão!')
      } else {
        alert(data.error || 'Erro ao imprimir etiqueta')
      }
    } catch (error) {
      console.error('Erro ao imprimir:', error)
      alert('Erro ao imprimir etiqueta')
    } finally {
      setPrinting(null)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/producao"
            className="w-10 h-10 bg-zinc-100 hover:bg-zinc-200 rounded-xl flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 bg-[#FFD700] rounded-xl flex items-center justify-center">
            <Printer className="w-6 h-6 text-zinc-900" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Estação de Etiquetas</h1>
            <p className="text-zinc-500">Imprima etiquetas para os pedidos de produção</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Digite o código do pedido ou nome do produto..."
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-[#FFD700] hover:bg-[#E6C200] text-zinc-900 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <Search className="w-5 h-5" />
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </div>

        {orders.length > 0 && (
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <div className="p-6 border-b border-zinc-200">
              <h2 className="text-lg font-semibold text-zinc-900">Pedidos Encontrados</h2>
              <p className="text-sm text-zinc-500 mt-1">{orders.length} pedido(s) disponível(is) para impressão</p>
            </div>

            <div className="divide-y divide-zinc-200">
              {orders.map((order) => (
                <div key={order.id} className="p-6 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-zinc-900">{order.code}</span>
                      <span className="text-sm text-zinc-500">•</span>
                      <span className="text-sm text-zinc-600">{order.customerName}</span>
                    </div>
                    <div className="text-lg font-medium text-zinc-900">{order.productMeasure}</div>
                    <div className="text-sm text-zinc-500 mt-1">{order.productName}</div>
                    <div className="text-sm text-zinc-600 mt-1">Quantidade: {order.quantity} unidades</div>
                  </div>

                  <button
                    onClick={() => handlePrint(order.id)}
                    disabled={printing === order.id}
                    className="flex items-center gap-2 px-6 py-3 bg-[#FFD700] hover:bg-[#E6C200] text-zinc-900 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    <Printer className="w-5 h-5" />
                    {printing === order.id ? 'Imprimindo...' : 'Imprimir Etiqueta'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && orders.length === 0 && searchTerm && (
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-12 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <div className="text-lg font-medium text-zinc-900 mb-2">Nenhum pedido encontrado</div>
            <div className="text-zinc-500">Tente buscar por outro código ou nome de produto</div>
          </div>
        )}

        {!searchTerm && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-12 text-center">
            <div className="text-4xl mb-4">🖨️</div>
            <div className="text-lg font-medium text-blue-900 mb-2">Estação de Etiquetas</div>
            <div className="text-blue-700">
              Digite o código do pedido ou nome do produto para buscar e imprimir etiquetas
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
