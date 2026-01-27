"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Package, Truck, User, Calendar, Search, Eye, AlertTriangle } from "lucide-react"
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
  trackingCode: string | null
  transportadora: string | null
  vendedor: string | null
  status: string | null
  photo: string | null
  createdAt: string
  ocorrenciasAbertas: number
  totalOcorrencias: number
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
  const [statusFilter, setStatusFilter] = useState<string>("TODOS")
  const [vendedorFilter, setVendedorFilter] = useState<string>("TODOS")
  const [transportadoraFilter, setTransportadoraFilter] = useState<string>("TODOS")
  const [ocorrenciaFilter, setOcorrenciaFilter] = useState<string>("TODOS")

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

  // Lista única de vendedores para o filtro
  const vendedores = [...new Set(retiradas.map(r => r.vendedor).filter(Boolean))] as string[]
  
  // Lista única de transportadoras para o filtro
  const transportadoras = [...new Set(retiradas.map(r => r.transportadora).filter(Boolean))] as string[]

  const filteredRetiradas = retiradas.filter(r => {
    // Filtro de busca
    const matchesSearch = 
      r.order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.retrieverName?.toLowerCase().includes(search.toLowerCase()) ||
      r.operatorName?.toLowerCase().includes(search.toLowerCase()) ||
      r.vendedor?.toLowerCase().includes(search.toLowerCase())
    
    // Filtro de status
    const matchesStatus = 
      statusFilter === "TODOS" || 
      r.status === statusFilter ||
      (statusFilter === "RETIRADO" && !r.status) // Registros antigos sem status são considerados RETIRADO
    
    // Filtro de vendedor
    const matchesVendedor = 
      vendedorFilter === "TODOS" || 
      r.vendedor === vendedorFilter
    
    // Filtro de transportadora
    const matchesTransportadora = 
      transportadoraFilter === "TODOS" || 
      r.transportadora === transportadoraFilter
    
    // Filtro de ocorrências
    const matchesOcorrencia = 
      ocorrenciaFilter === "TODOS" || 
      (ocorrenciaFilter === "COM_ABERTA" && r.ocorrenciasAbertas > 0) ||
      (ocorrenciaFilter === "SEM_OCORRENCIA" && r.totalOcorrencias === 0)
    
    return matchesSearch && matchesStatus && matchesVendedor && matchesTransportadora && matchesOcorrencia
  })

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Relatório de Retiradas</h1>
          <p className="text-zinc-600 mt-1">Visualize todas as retiradas realizadas</p>
        </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por pedido, retirante, operador ou vendedor..."
                className="w-full pl-10 pr-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent bg-white min-w-[180px]"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="AGUARDANDO_RETIRADA">Aguardando Retirada</option>
              <option value="RETIRADO">Retirado</option>
            </select>
            <select
              value={vendedorFilter}
              onChange={(e) => setVendedorFilter(e.target.value)}
              className="px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent bg-white min-w-[180px]"
            >
              <option value="TODOS">Todos os Vendedores</option>
              {vendedores.map(vendedor => (
                <option key={vendedor} value={vendedor}>{vendedor}</option>
              ))}
            </select>
            <select
              value={transportadoraFilter}
              onChange={(e) => setTransportadoraFilter(e.target.value)}
              className="px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent bg-white min-w-[200px]"
            >
              <option value="TODOS">Todas as Transportadoras</option>
              {transportadoras.map(transportadora => (
                <option key={transportadora} value={transportadora}>{transportadora}</option>
              ))}
            </select>
            <select
              value={ocorrenciaFilter}
              onChange={(e) => setOcorrenciaFilter(e.target.value)}
              className="px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent bg-white min-w-[180px]"
            >
              <option value="TODOS">Todas</option>
              <option value="COM_ABERTA">Com Ocorrência Aberta</option>
              <option value="SEM_OCORRENCIA">Sem Ocorrência</option>
            </select>
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
                <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                  <Truck className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-zinc-600">Aguardando Retirada</p>
                  <p className="text-2xl font-bold text-zinc-900">{retiradas.filter(r => r.status === 'AGUARDANDO_RETIRADA').length}</p>
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
                      <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Vendedor</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Transportadora</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Ocorr.</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Rastreio</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Data</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Status</th>
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
                          <p className="text-zinc-900">{retirada.vendedor || '-'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-zinc-900">{retirada.transportadora || '-'}</p>
                        </td>
                        <td className="px-6 py-4">
                          {retirada.ocorrenciasAbertas > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium">
                              <AlertTriangle className="w-3 h-3" />
                              {retirada.ocorrenciasAbertas}
                            </span>
                          ) : retirada.totalOcorrencias > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium">
                              ✓ {retirada.totalOcorrencias}
                            </span>
                          ) : (
                            <span className="text-zinc-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {retirada.trackingCode ? (
                            retirada.trackingCode.startsWith('http') ? (
                              <a 
                                href={retirada.trackingCode} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm truncate max-w-[150px] block"
                                title={retirada.trackingCode}
                              >
                                🔗 Ver rastreio
                              </a>
                            ) : (
                              <span className="text-sm text-zinc-900 truncate max-w-[150px] block" title={retirada.trackingCode}>
                                {retirada.trackingCode}
                              </span>
                            )
                          ) : (
                            <span className="text-sm text-zinc-400">-</span>
                          )}
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
                          {retirada.status === 'AGUARDANDO_RETIRADA' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium">
                              ⏳ Aguardando
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium">
                              ✓ Retirado
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
