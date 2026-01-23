"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Package, Truck, User, Calendar, Search, Eye } from "lucide-react"
import Link from "next/link"
import MainLayout from "@/components/MainLayout"

interface Retirada {
  id: string
  cpfLast4: string | null
  operatorId: string | null
  operatorName: string | null
  customerName: string | null
  customerCpfCnpj: string | null
  retrieverName: string | null
  photo: string | null
  createdAt: string
  order: {
    id: string
    tinyOrderId: string
    orderNumber: string
    statusTiny: string
    statusInterno: string
    createdAt: string
  }
}

export default function RelatorioRetiradas() {
  const [retiradas, setRetiradas] = useState<Retirada[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetchRetiradas()
  }, [])

  const fetchRetiradas = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/retiradas?limit=100')
      const data = await res.json()
      
      if (data.ok) {
        setRetiradas(data.retiradas)
      }
    } catch (error) {
      console.error('Erro ao buscar retiradas:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredRetiradas = retiradas.filter(r => 
    r.order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
    r.retrieverName?.toLowerCase().includes(search.toLowerCase()) ||
    r.operatorName?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Relatório de Retiradas</h1>
          <p className="text-zinc-600 mt-1">Visualize todas as retiradas realizadas</p>
        </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por pedido, retirante ou operador..."
              className="w-full pl-10 pr-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-zinc-200 p-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#FFD700]/20 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-[#FFD700]" />
                </div>
                <div>
                  <p className="text-sm text-zinc-600">Total de Retiradas</p>
                  <p className="text-2xl font-bold text-zinc-900">{retiradas.length}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border border-zinc-200 p-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <Truck className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-zinc-600">Com Foto</p>
                  <p className="text-2xl font-bold text-zinc-900">{retiradas.filter(r => r.photo).length}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border border-zinc-200 p-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-zinc-600">Hoje</p>
                  <p className="text-2xl font-bold text-zinc-900">
                    {retiradas.filter(r => {
                      const today = new Date().toDateString()
                      const retDate = new Date(r.createdAt).toDateString()
                      return today === retDate
                    }).length}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl border border-zinc-200 overflow-hidden"
          >
            {loading ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-zinc-600 mt-4">Carregando retiradas...</p>
              </div>
            ) : filteredRetiradas.length === 0 ? (
              <div className="p-12 text-center">
                <Package className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
                <p className="text-zinc-600">Nenhuma retirada encontrada</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-50 border-b border-zinc-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Pedido</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Retirante</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Operador</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Data</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Foto</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {filteredRetiradas.map((retirada) => (
                      <tr key={retirada.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-zinc-900">#{retirada.order.orderNumber}</p>
                            <p className="text-sm text-zinc-600">ID: {retirada.order.tinyOrderId}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-zinc-900">{retirada.retrieverName || 'N/A'}</p>
                            <p className="text-sm text-zinc-600">CPF: {retirada.customerCpfCnpj || retirada.cpfLast4 || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-zinc-900">{retirada.operatorName || 'N/A'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-zinc-600">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm">
                              {new Date(retirada.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {retirada.photo ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium">
                              ✓ Sim
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-100 text-zinc-600 rounded-lg text-xs font-medium">
                              ✕ Não
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/admin/retiradas/${retirada.id}`}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-[#FFD700] text-zinc-900 rounded-lg hover:bg-[#FFC700] transition-colors text-sm font-medium"
                          >
                            <Eye className="w-4 h-4" />
                            Ver Detalhes
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </div>
      </MainLayout>
    )
  }
