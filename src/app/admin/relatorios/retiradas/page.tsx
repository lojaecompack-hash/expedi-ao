"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Package, Truck, User, Search, Eye, AlertTriangle, Trash2, X } from "lucide-react"
import Link from "next/link"
import MainLayout from "@/components/MainLayout"
import { useRouter } from "next/navigation"

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
  statusUltimaOcorrencia: string | null
  setorDestinoUltimaOcorrencia: string | null
  numeroRetirada: number
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
  const router = useRouter()
  const [retiradas, setRetiradas] = useState<Retirada[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("TODOS")
  const [vendedorFilter, setVendedorFilter] = useState<string>("TODOS")
  const [transportadoraFilter, setTransportadoraFilter] = useState<string>("TODOS")
  const [ocorrenciaFilter, setOcorrenciaFilter] = useState<string>("TODOS")
  const [setorFilter, setSetorFilter] = useState<string>("TODOS")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [userRole, setUserRole] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteType, setDeleteType] = useState<'single' | 'bulk'>('single')
  const [deleteTarget, setDeleteTarget] = useState<Retirada | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchRetiradas()
    fetchUserRole()
  }, [setorFilter])

  const fetchUserRole = async () => {
    try {
      const res = await fetch('/api/user-role')
      const data = await res.json()
      if (data.ok) {
        setUserRole(data.role)
      }
    } catch (error) {
      console.error('Erro ao buscar role:', error)
    }
  }

  const fetchRetiradas = async () => {
    setLoading(true)
    try {
      let url = '/api/retiradas?limit=100'
      if (setorFilter && setorFilter !== 'TODOS') {
        url += `&setorDestino=${encodeURIComponent(setorFilter)}`
      }
      const res = await fetch(url)
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

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedIds.length === filteredRetiradas.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredRetiradas.map(r => r.id))
    }
  }

  const handleDeleteOne = (retirada: Retirada) => {
    setDeleteType('single')
    setDeleteTarget(retirada)
    setShowDeleteModal(true)
  }

  const handleDeleteSelected = () => {
    setDeleteType('bulk')
    setDeleteTarget(null)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      if (deleteType === 'single' && deleteTarget) {
        const res = await fetch(`/api/retiradas/${deleteTarget.id}`, {
          method: 'DELETE'
        })
        const data = await res.json()
        if (data.ok) {
          setRetiradas(prev => prev.filter(r => r.id !== deleteTarget.id))
          setShowDeleteModal(false)
        } else {
          alert(data.error || 'Erro ao excluir retirada')
        }
      } else if (deleteType === 'bulk') {
        const res = await fetch('/api/retiradas/bulk', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: selectedIds })
        })
        const data = await res.json()
        if (data.ok) {
          setRetiradas(prev => prev.filter(r => !selectedIds.includes(r.id)))
          setSelectedIds([])
          setShowDeleteModal(false)
        } else {
          alert(data.error || 'Erro ao excluir retiradas')
        }
      }
    } catch (error) {
      console.error('Erro ao excluir:', error)
      alert('Erro ao excluir retirada(s)')
    } finally {
      setDeleting(false)
    }
  }

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
      (statusFilter === "RETIRADO" && !r.status) || // Registros antigos sem status são considerados RETIRADO
      (statusFilter === "RETORNADO" && r.status === "RETORNADO")
    
    // Filtro de vendedor
    const matchesVendedor = 
      vendedorFilter === "TODOS" || 
      r.vendedor === vendedorFilter
    
    // Filtro de transportadora
    const matchesTransportadora = 
      transportadoraFilter === "TODOS" || 
      r.transportadora === transportadoraFilter
    
    // Filtro de ocorrências (focado em comunicação)
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
          <h1 className="text-lg font-bold text-zinc-900">Relatório de Retiradas</h1>
          <p className="text-xs text-zinc-600 mt-1">Visualize todas as retiradas realizadas</p>
        </div>

          {/* Filters */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-4">
            <div className="flex flex-col">
              <label className="text-xs font-medium text-zinc-700 mb-1">Status da Retirada</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-tiny border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent bg-white min-w-[160px]"
              >
                <option value="TODOS">Todos os Status</option>
                <option value="AGUARDANDO_RETIRADA">⏳ Aguardando Retirada</option>
                <option value="RETIRADO">✓ Retirado</option>
                <option value="RETORNADO">📦 Retornado / Aguardando Reenvio</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-medium text-zinc-700 mb-1">Vendedores</label>
              <select
                value={vendedorFilter}
                onChange={(e) => setVendedorFilter(e.target.value)}
                className="px-3 py-2 text-tiny border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent bg-white min-w-[160px]"
              >
                <option value="TODOS">Todos os Vendedores</option>
                {vendedores.map(vendedor => (
                  <option key={vendedor} value={vendedor}>{vendedor}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-medium text-zinc-700 mb-1">Transportadora</label>
              <select
                value={transportadoraFilter}
                onChange={(e) => setTransportadoraFilter(e.target.value)}
                className="px-3 py-2 text-tiny border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent bg-white min-w-[180px]"
              >
                <option value="TODOS">Todas as Transportadoras</option>
                {transportadoras.map(transportadora => (
                  <option key={transportadora} value={transportadora}>{transportadora}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-medium text-zinc-700 mb-1">Ocorrência</label>
              <select
                value={ocorrenciaFilter}
                onChange={(e) => setOcorrenciaFilter(e.target.value)}
                className="px-3 py-2 text-tiny border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent bg-white min-w-[160px]"
              >
                <option value="TODOS">Todas</option>
                <option value="COM_ABERTA">🔴 Com Ocorrência Aberta</option>
                <option value="SEM_OCORRENCIA">⚪ Sem Ocorrência</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-medium text-zinc-700 mb-1">Setor</label>
              <select
                value={setorFilter}
                onChange={(e) => setSetorFilter(e.target.value)}
                className="px-3 py-2 text-tiny border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent bg-white min-w-[160px]"
              >
                <option value="TODOS">Todos</option>
                <option value="Expedição">Expedição</option>
                <option value="Vendas">Vendas</option>
                <option value="Financeiro">Financeiro</option>
              </select>
            </div>
            </div>
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por pedido, retirante, operador ou vendedor..."
                className="w-full pl-9 pr-3 py-2 text-tiny border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-zinc-200 p-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#FFD700]/20 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-[#FFD700]" />
                </div>
                <div>
                  <p className="text-xs text-zinc-600">Total de Retiradas</p>
                  <p className="text-xl font-bold text-zinc-900">{retiradas.length}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl border border-zinc-200 p-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                  <Truck className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-zinc-600">Aguardando Retirada</p>
                  <p className="text-xl font-bold text-zinc-900">{retiradas.filter(r => r.status === 'AGUARDANDO_RETIRADA').length}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl border border-zinc-200 p-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-zinc-600">Hoje</p>
                  <p className="text-xl font-bold text-zinc-900">
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
            className="bg-white rounded-xl border border-zinc-200 overflow-hidden"
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
                      {userRole === 'ADMIN' && (
                        <th className="px-4 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedIds.length === filteredRetiradas.length && filteredRetiradas.length > 0}
                            onChange={handleSelectAll}
                            className="w-4 h-4 rounded border-zinc-300 text-[#FFD700] focus:ring-[#FFD700]"
                          />
                        </th>
                      )}
                      <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-900">Ocorr.</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-900">Data</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-900">Pedido</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-900">Vendedor</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-900">Operador</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-900">Transportadora</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-900">Rastreio</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-900">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-900">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {filteredRetiradas.map((retirada) => (
                      <tr key={retirada.id} className="hover:bg-zinc-50 transition-colors">
                        {userRole === 'ADMIN' && (
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(retirada.id)}
                              onChange={() => handleSelectOne(retirada.id)}
                              className="w-4 h-4 rounded border-zinc-300 text-[#FFD700] focus:ring-[#FFD700]"
                            />
                          </td>
                        )}
                        <td className="px-4 py-3">
                          {retirada.statusUltimaOcorrencia === 'PENDENTE' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium">
                              <AlertTriangle className="w-3 h-3" />
                              Pendente
                            </span>
                          ) : retirada.statusUltimaOcorrencia === 'RESPONDIDA' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium">
                              Respondida
                            </span>
                          ) : retirada.statusUltimaOcorrencia === 'RESOLVIDA' || retirada.totalOcorrencias > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium">
                              ✓ Resolvida
                            </span>
                          ) : (
                            <span className="text-zinc-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] text-zinc-600">
                            {new Date(retirada.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-tiny text-zinc-900">#{retirada.order.orderNumber}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-tiny text-zinc-900">{retirada.vendedor || '-'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-tiny text-zinc-900">{retirada.operatorName || 'N/A'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-tiny text-zinc-900">{retirada.transportadora || '-'}</p>
                        </td>
                        <td className="px-4 py-3">
                          {retirada.trackingCode ? (
                            retirada.trackingCode.startsWith('http') ? (
                              <a 
                                href={retirada.trackingCode} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-tiny truncate max-w-[140px] block"
                                title={retirada.trackingCode}
                              >
                                🔗 Ver rastreio
                              </a>
                            ) : (
                              <span className="text-tiny text-zinc-900 truncate max-w-[140px] block" title={retirada.trackingCode}>
                                {retirada.trackingCode}
                              </span>
                            )
                          ) : (
                            <span className="text-tiny text-zinc-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {retirada.status === 'AGUARDANDO_RETIRADA' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[11px] font-medium">
                              ⏳ Aguardando
                            </span>
                          ) : retirada.status === 'RETORNADO' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-[11px] font-medium">
                              📦 Retornado
                            </span>
                          ) : retirada.numeroRetirada > 1 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[11px] font-medium">
                              🔄 Reenviado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-[11px] font-medium">
                              ✓ Retirado
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/admin/retiradas/${retirada.id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFD700] text-zinc-900 rounded-lg hover:bg-[#FFC700] transition-colors text-tiny font-medium"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Ver Detalhes
                            </Link>
                            {userRole === 'ADMIN' && (
                              <button
                                onClick={() => handleDeleteOne(retirada)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-tiny font-medium"
                                title="Excluir retirada"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>

          {/* Botão flutuante de exclusão em massa */}
          <AnimatePresence>
            {userRole === 'ADMIN' && selectedIds.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="fixed bottom-8 right-8 z-50"
              >
                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center gap-3 px-6 py-4 bg-red-500 text-white rounded-xl shadow-lg hover:bg-red-600 transition-colors font-medium"
                >
                  <Trash2 className="w-5 h-5" />
                  {selectedIds.length} selecionado(s) - Excluir
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Modal de confirmação */}
          <AnimatePresence>
            {showDeleteModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                onClick={() => !deleting && setShowDeleteModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-zinc-900">Confirmar Exclusão</h3>
                    <button
                      onClick={() => !deleting && setShowDeleteModal(false)}
                      className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
                      disabled={deleting}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {deleteType === 'single' && deleteTarget ? (
                    <div className="mb-6">
                      <p className="text-zinc-700 mb-4">Tem certeza que deseja excluir esta retirada?</p>
                      <div className="bg-zinc-50 rounded-lg p-4 space-y-2">
                        <p className="text-sm"><span className="font-semibold">Pedido:</span> #{deleteTarget.order.orderNumber}</p>
                        <p className="text-sm"><span className="font-semibold">Data:</span> {new Date(deleteTarget.createdAt).toLocaleDateString('pt-BR')}</p>
                        <p className="text-sm"><span className="font-semibold">Vendedor:</span> {deleteTarget.vendedor || '-'}</p>
                        <p className="text-sm"><span className="font-semibold">Operador:</span> {deleteTarget.operatorName || 'N/A'}</p>
                      </div>
                      <p className="text-red-600 text-sm mt-4 font-medium">⚠️ Esta ação não pode ser desfeita. Todas as ocorrências vinculadas também serão excluídas.</p>
                    </div>
                  ) : (
                    <div className="mb-6">
                      <p className="text-zinc-700 mb-4">Tem certeza que deseja excluir <span className="font-bold">{selectedIds.length}</span> retirada(s)?</p>
                      <p className="text-red-600 text-sm font-medium">⚠️ Esta ação não pode ser desfeita. Todas as ocorrências vinculadas também serão excluídas.</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      disabled={deleting}
                      className="flex-1 px-4 py-2 border border-zinc-300 text-zinc-700 rounded-lg hover:bg-zinc-50 transition-colors font-medium disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={confirmDelete}
                      disabled={deleting}
                      className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {deleting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Excluindo...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          Excluir
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </MainLayout>
    )
  }
