"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Package, Truck, User, Calendar, ArrowLeft, Image as ImageIcon, Edit2, Save, X, Loader2, AlertTriangle, CheckCircle, Plus } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

interface Ocorrencia {
  id: string
  descricao: string
  status: string
  operadorNome: string | null
  resolvidoEm: string | null
  resolvidoPor: string | null
  createdAt: string
}

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
  status: string | null
  photo: string | null
  createdAt: string
  order: {
    id: string
    tinyOrderId: string
    orderNumber: string
    statusTiny: string
    statusInterno: string
    createdAt: string
    updatedAt: string
  }
}

export default function DetalhesRetirada() {
  const params = useParams()
  const id = params.id as string
  
  const [retirada, setRetirada] = useState<Retirada | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Estados para edição do rastreio
  const [editingTracking, setEditingTracking] = useState(false)
  const [trackingCode, setTrackingCode] = useState("")
  const [savingTracking, setSavingTracking] = useState(false)
  
  // Estados para ocorrências
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([])
  const [novaOcorrencia, setNovaOcorrencia] = useState("")
  const [salvandoOcorrencia, setSalvandoOcorrencia] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [ocorrenciaCriada, setOcorrenciaCriada] = useState<Ocorrencia | null>(null)

  useEffect(() => {
    if (id) {
      fetchRetirada()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const fetchRetirada = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/retiradas/${id}`)
      const data = await res.json()
      
      if (data.ok) {
        setRetirada(data.retirada)
        setTrackingCode(data.retirada.trackingCode || "")
      }
    } catch (error) {
      console.error('Erro ao buscar retirada:', error)
    } finally {
      setLoading(false)
    }
  }

  // Função para salvar rastreio editado
  const saveTrackingCode = async () => {
    if (!retirada) return
    
    setSavingTracking(true)
    try {
      const res = await fetch(`/api/retiradas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingCode: trackingCode.trim() })
      })
      
      const data = await res.json()
      
      if (data.ok) {
        setRetirada({ ...retirada, trackingCode: trackingCode.trim() })
        setEditingTracking(false)
      } else {
        alert('Erro ao salvar rastreio: ' + (data.error || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Erro ao salvar rastreio:', error)
      alert('Erro ao salvar rastreio')
    } finally {
      setSavingTracking(false)
    }
  }

  // Cancelar edição
  const cancelEditTracking = () => {
    setTrackingCode(retirada?.trackingCode || "")
    setEditingTracking(false)
  }

  // Buscar ocorrências
  const fetchOcorrencias = async () => {
    try {
      const res = await fetch(`/api/retiradas/${id}/ocorrencias`)
      const data = await res.json()
      if (data.ok) {
        setOcorrencias(data.ocorrencias)
      }
    } catch (error) {
      console.error('Erro ao buscar ocorrências:', error)
    }
  }

  // Criar nova ocorrência
  const criarOcorrencia = async () => {
    if (!novaOcorrencia.trim()) return
    
    setSalvandoOcorrencia(true)
    try {
      const res = await fetch(`/api/retiradas/${id}/ocorrencias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          descricao: novaOcorrencia.trim(),
          operadorNome: retirada?.operatorName || null
        })
      })
      
      const data = await res.json()
      
      if (data.ok) {
        setOcorrenciaCriada(data.ocorrencia)
        setNovaOcorrencia("")
        setShowModal(true)
        fetchOcorrencias()
      } else {
        alert('Erro ao criar ocorrência: ' + (data.error || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Erro ao criar ocorrência:', error)
      alert('Erro ao criar ocorrência')
    } finally {
      setSalvandoOcorrencia(false)
    }
  }

  // Atualizar status da ocorrência
  const atualizarStatusOcorrencia = async (ocorrenciaId: string, novoStatus: string) => {
    try {
      const res = await fetch(`/api/retiradas/${id}/ocorrencias/${ocorrenciaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: novoStatus,
          resolvidoPor: retirada?.operatorName || null
        })
      })
      
      const data = await res.json()
      
      if (data.ok) {
        fetchOcorrencias()
        setShowModal(false)
        setOcorrenciaCriada(null)
      } else {
        alert('Erro ao atualizar ocorrência: ' + (data.error || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Erro ao atualizar ocorrência:', error)
      alert('Erro ao atualizar ocorrência')
    }
  }

  // Buscar ocorrências quando carregar a página
  useEffect(() => {
    if (id && retirada) {
      fetchOcorrencias()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, retirada])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-zinc-600 mt-4">Carregando detalhes...</p>
        </div>
      </div>
    )
  }

  if (!retirada) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
          <p className="text-zinc-600">Retirada não encontrada</p>
          <Link href="/admin/relatorios/retiradas" className="text-[#FFD700] hover:underline mt-4 inline-block">
            Voltar para relatórios
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r border-zinc-200">
        <div className="flex h-16 items-center px-6 border-b border-zinc-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#FFD700] rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-zinc-900" />
            </div>
            <span className="text-xl font-semibold text-zinc-900">Ecompack</span>
          </div>
        </div>
        
        <nav className="p-4 space-y-2">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-100 text-zinc-700 transition-colors">
            <Package className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link href="/expedicao/retirada" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-100 text-zinc-700 transition-colors">
            <Truck className="w-5 h-5" />
            <span className="font-medium">Retirada</span>
          </Link>
          <Link href="/admin/relatorios/retiradas" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#FFD700] text-zinc-900">
            <Package className="w-5 h-5" />
            <span className="font-medium">Relatórios</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="ml-64 p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link href="/admin/relatorios/retiradas" className="p-2 hover:bg-zinc-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-zinc-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-zinc-900">Detalhes da Retirada</h1>
              <p className="text-zinc-600 mt-1">Informações completas do pedido #{retirada.order.orderNumber}</p>
            </div>
          </div>

          {/* Dados do Pedido */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-zinc-200 p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#FFD700]/20 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-[#FFD700]" />
              </div>
              <h2 className="text-xl font-bold text-zinc-900">Dados do Pedido</h2>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-zinc-600 mb-1">Número do Pedido</p>
                <p className="text-lg font-semibold text-zinc-900">#{retirada.order.orderNumber}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-600 mb-1">ID Tiny</p>
                <p className="text-lg font-semibold text-zinc-900">{retirada.order.tinyOrderId}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-600 mb-1">Status Tiny</p>
                <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                  {retirada.order.statusTiny}
                </span>
              </div>
              <div>
                <p className="text-sm text-zinc-600 mb-1">Status Interno</p>
                <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                  {retirada.order.statusInterno}
                </span>
              </div>
              <div>
                <p className="text-sm text-zinc-600 mb-1">Criado em</p>
                <div className="flex items-center gap-2 text-zinc-900">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(retirada.order.createdAt).toLocaleString('pt-BR')}</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-zinc-600 mb-1">Atualizado em</p>
                <div className="flex items-center gap-2 text-zinc-900">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(retirada.order.updatedAt).toLocaleString('pt-BR')}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Dados da Retirada */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-zinc-200 p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                <Truck className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-zinc-900">Dados da Retirada</h2>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-zinc-600 mb-1">Nome do Retirante</p>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-zinc-400" />
                  <p className="text-lg font-semibold text-zinc-900">{retirada.retrieverName || 'Não informado'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-zinc-600 mb-1">CPF</p>
                <p className="text-lg font-semibold text-zinc-900">{retirada.customerCpfCnpj || retirada.cpfLast4 || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-600 mb-1">Operador</p>
                <p className="text-lg font-semibold text-zinc-900">{retirada.operatorName || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-600 mb-1">Transportadora</p>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-zinc-400" />
                  <p className="text-lg font-semibold text-zinc-900">{retirada.transportadora || 'Não definida'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-zinc-600 mb-1">Data da Retirada</p>
                <div className="flex items-center gap-2 text-zinc-900">
                  <Calendar className="w-4 h-4" />
                  <span className="font-semibold">{new Date(retirada.createdAt).toLocaleString('pt-BR')}</span>
                </div>
              </div>
              <div className="col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-zinc-600">Código de Rastreio</p>
                  {/* Só permite editar se status for AGUARDANDO_RETIRADA (não RETIRADO) */}
                  {!editingTracking && retirada.status === 'AGUARDANDO_RETIRADA' && (
                    <button
                      onClick={() => setEditingTracking(true)}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <Edit2 className="w-4 h-4" />
                      Editar
                    </button>
                  )}
                </div>
                
                {editingTracking ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={trackingCode}
                      onChange={(e) => setTrackingCode(e.target.value)}
                      placeholder="Digite o código ou link de rastreio"
                      className="flex-1 px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
                    />
                    <button
                      onClick={saveTrackingCode}
                      disabled={savingTracking}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {savingTracking ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Salvar
                    </button>
                    <button
                      onClick={cancelEditTracking}
                      disabled={savingTracking}
                      className="px-4 py-2 bg-zinc-200 text-zinc-700 rounded-lg hover:bg-zinc-300 disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  retirada.trackingCode ? (
                    retirada.trackingCode.startsWith('http') ? (
                      <a 
                        href={retirada.trackingCode} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-lg font-semibold flex items-center gap-2"
                      >
                        <Truck className="w-5 h-5" />
                        Abrir rastreio
                      </a>
                    ) : (
                      <p className="text-lg font-semibold text-zinc-900">{retirada.trackingCode}</p>
                    )
                  ) : (
                    <p className="text-lg font-semibold text-zinc-400">Não informado</p>
                  )
                )}
              </div>
            </div>
          </motion.div>

          {/* Ocorrências */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl border border-zinc-200 p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-xl font-bold text-zinc-900">Ocorrências</h2>
              {ocorrencias.filter(o => o.status === 'ABERTO').length > 0 && (
                <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium">
                  {ocorrencias.filter(o => o.status === 'ABERTO').length} aberta(s)
                </span>
              )}
            </div>

            {/* Formulário para nova ocorrência */}
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                value={novaOcorrencia}
                onChange={(e) => setNovaOcorrencia(e.target.value)}
                placeholder="Descreva a ocorrência..."
                className="flex-1 px-4 py-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
                onKeyDown={(e) => e.key === 'Enter' && criarOcorrencia()}
              />
              <button
                onClick={criarOcorrencia}
                disabled={salvandoOcorrencia || !novaOcorrencia.trim()}
                className="px-4 py-3 bg-[#FFD700] text-zinc-900 rounded-xl hover:bg-[#FFC700] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
              >
                {salvandoOcorrencia ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Plus className="w-5 h-5" />
                )}
                Registrar
              </button>
            </div>

            {/* Lista de ocorrências */}
            {ocorrencias.length === 0 ? (
              <p className="text-zinc-500 text-center py-4">Nenhuma ocorrência registrada</p>
            ) : (
              <div className="space-y-4">
                {ocorrencias.map((ocorrencia) => (
                  <div
                    key={ocorrencia.id}
                    className={`p-4 rounded-xl border ${
                      ocorrencia.status === 'ABERTO' 
                        ? 'border-red-200 bg-red-50' 
                        : 'border-green-200 bg-green-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {ocorrencia.status === 'ABERTO' ? (
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              ABERTO
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              RESOLVIDO
                            </span>
                          )}
                          <span className="text-xs text-zinc-500">
                            {new Date(ocorrencia.createdAt).toLocaleString('pt-BR')}
                          </span>
                          {ocorrencia.operadorNome && (
                            <span className="text-xs text-zinc-500">
                              por {ocorrencia.operadorNome}
                            </span>
                          )}
                        </div>
                        <p className="text-zinc-900">{ocorrencia.descricao}</p>
                        {ocorrencia.status === 'RESOLVIDO' && ocorrencia.resolvidoEm && (
                          <p className="text-xs text-green-600 mt-2">
                            Resolvido em {new Date(ocorrencia.resolvidoEm).toLocaleString('pt-BR')}
                            {ocorrencia.resolvidoPor && ` por ${ocorrencia.resolvidoPor}`}
                          </p>
                        )}
                      </div>
                      {ocorrencia.status === 'ABERTO' && (
                        <button
                          onClick={() => atualizarStatusOcorrencia(ocorrencia.id, 'RESOLVIDO')}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center gap-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Resolver
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Modal após criar ocorrência */}
          {showModal && ocorrenciaCriada && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-xl"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900">Ocorrência Registrada</h3>
                </div>
                
                <p className="text-zinc-600 mb-6">
                  Deseja marcar esta ocorrência como resolvida agora?
                </p>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowModal(false)
                      setOcorrenciaCriada(null)
                    }}
                    className="flex-1 px-4 py-3 border border-zinc-200 text-zinc-700 rounded-xl hover:bg-zinc-50 font-medium"
                  >
                    Manter Aberta
                  </button>
                  <button
                    onClick={() => atualizarStatusOcorrencia(ocorrenciaCriada.id, 'RESOLVIDO')}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Marcar Resolvida
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Foto */}
          {retirada.photo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border border-zinc-200 p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-zinc-900">Foto do Produto/Documento</h2>
              </div>

              <div className="rounded-xl overflow-hidden border border-zinc-200">
                <img 
                  src={retirada.photo} 
                  alt="Foto da retirada" 
                  className="w-full h-auto object-contain max-h-96"
                />
              </div>
            </motion.div>
          )}

          {!retirada.photo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border border-zinc-200 p-8 text-center"
            >
              <ImageIcon className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
              <p className="text-zinc-600">Nenhuma foto foi tirada nesta retirada</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
