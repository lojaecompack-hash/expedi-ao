'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/MainLayout'
import { ArrowLeft, Plus, Pause, Play, Package, Printer, CheckCircle, RefreshCw } from 'lucide-react'
import Link from 'next/link'

interface ProductionOrder {
  id: string
  code: string
  productSku: string
  productName: string
  productMeasure: string
  bobinaSku: string
  bobinaPesoInicial: number
  bobinaPesoFinal: number | null
  bobinaOrigem: string
  turnoInicial: string
  pesoTotalProduzido: number
  totalApara: number
  totalPacotes: number
  totalUnidades: number
  status: string
  sessoes: Array<{
    id: string
    operatorName: string
    turno: string
    machine: { code: string; name: string }
  }>
  pacotes: Array<{
    id: string
    sequencia: number
    quantidade: number
    etiquetaCodigo: string
    etiquetaGerada: boolean
  }>
  aparas: Array<{
    id: string
    peso: number
    operatorName: string
    createdAt: string
  }>
}

interface ProductionOperator {
  id: string
  name: string
}

const turnoLabel = (turno: string) => {
  const labels: Record<string, string> = { 'MANHA': 'Manhã', 'TARDE': 'Tarde', 'NOITE': 'Noite' }
  return labels[turno] || turno
}

export default function OPDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  
  const [order, setOrder] = useState<ProductionOrder | null>(null)
  const [operators, setOperators] = useState<ProductionOperator[]>([])
  const [loading, setLoading] = useState(true)
  
  // Modais
  const [showAparaModal, setShowAparaModal] = useState(false)
  const [showPacoteModal, setShowPacoteModal] = useState(false)
  const [showParadaModal, setShowParadaModal] = useState(false)
  const [showFinalizarModal, setShowFinalizarModal] = useState(false)
  
  // Formulários
  const [aparaForm, setAparaForm] = useState({ peso: '' })
  const [pacoteForm, setPacoteForm] = useState({ quantidade: 1000 })
  const [pesoForm, setPesoForm] = useState({ peso: '' })

  useEffect(() => {
    fetchOrder()
    fetchOperators()
  }, [id])

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/production/orders/${id}`)
      const data = await res.json()
      if (data.ok) {
        setOrder(data.order)
        setPesoForm({ peso: String(data.order.pesoTotalProduzido) })
      }
    } catch (error) {
      console.error('Erro ao buscar ordem:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchOperators = async () => {
    try {
      const res = await fetch('/api/production-operators?type=CORTE_SOLDA')
      const data = await res.json()
      if (data.ok) {
        setOperators(data.operators)
      }
    } catch (error) {
      console.error('Erro ao buscar operadores:', error)
    }
  }

  const handleUpdatePeso = async () => {
    if (!pesoForm.peso) return
    try {
      const res = await fetch(`/api/production/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_PESO',
          pesoTotalProduzido: parseFloat(pesoForm.peso)
        })
      })
      const data = await res.json()
      if (data.ok) {
        fetchOrder()
      }
    } catch (error) {
      console.error('Erro ao atualizar peso:', error)
    }
  }

  const handleLancarApara = async () => {
    if (!aparaForm.peso || !order) return
    const session = order.sessoes[0]
    try {
      const res = await fetch(`/api/production/orders/${id}/aparas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          peso: parseFloat(aparaForm.peso),
          operatorId: session?.id || 'unknown',
          operatorName: session?.operatorName || 'Operador',
          machineId: 'unknown',
          turno: session?.turno || 'MANHA'
        })
      })
      const data = await res.json()
      if (data.ok) {
        setAparaForm({ peso: '' })
        setShowAparaModal(false)
        fetchOrder()
      } else {
        alert(data.error)
      }
    } catch (error) {
      console.error('Erro ao lançar apara:', error)
    }
  }

  const handleGerarPacote = async () => {
    if (!order) return
    const session = order.sessoes[0]
    try {
      const res = await fetch(`/api/production/orders/${id}/pacotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantidade: pacoteForm.quantidade,
          operatorName: session?.operatorName,
          machineName: session?.machine?.code,
          turno: session?.turno
        })
      })
      const data = await res.json()
      if (data.ok) {
        setShowPacoteModal(false)
        fetchOrder()
        // Abrir página de impressão
        alert(`Pacote #${data.pacote.sequencia} criado!\nEtiqueta: ${data.etiqueta.codigo}`)
      } else {
        alert(data.error)
      }
    } catch (error) {
      console.error('Erro ao gerar pacote:', error)
    }
  }

  const handleFinalizar = async () => {
    try {
      const res = await fetch(`/api/production/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'FINALIZAR',
          pesoTotalProduzido: parseFloat(pesoForm.peso),
          totalUnidades: order?.totalUnidades
        })
      })
      const data = await res.json()
      if (data.ok) {
        alert('Ordem finalizada! Aguardando conferência.')
        router.push('/producao')
      } else {
        alert(data.error)
      }
    } catch (error) {
      console.error('Erro ao finalizar:', error)
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

  if (!order) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-bold text-zinc-900">Ordem não encontrada</h2>
          <Link href="/producao" className="text-[#FFD700] hover:underline mt-4 block">
            Voltar para Produção
          </Link>
        </div>
      </MainLayout>
    )
  }

  const session = order.sessoes[0]
  const pesoRestante = Number(order.bobinaPesoInicial) - Number(order.pesoTotalProduzido) - Number(order.totalApara)
  const progresso = Math.min(100, Math.round(((Number(order.pesoTotalProduzido) + Number(order.totalApara)) / Number(order.bobinaPesoInicial)) * 100))

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/producao" className="p-2 hover:bg-zinc-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <h1 className="text-2xl font-bold text-zinc-900">{order.code}</h1>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  Em Andamento
                </span>
              </div>
              <p className="text-zinc-500">{order.productMeasure} - {order.productName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={fetchOrder} className="p-2 hover:bg-zinc-100 rounded-lg">
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sessão Atual */}
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <div className="text-sm text-zinc-500">Operador</div>
                <div className="font-bold text-zinc-900">{session?.operatorName || '-'}</div>
              </div>
              <div className="h-8 w-px bg-zinc-200" />
              <div>
                <div className="text-sm text-zinc-500">Máquina</div>
                <div className="font-bold text-zinc-900">{session?.machine?.code || '-'}</div>
              </div>
              <div className="h-8 w-px bg-zinc-200" />
              <div>
                <div className="text-sm text-zinc-500">Turno</div>
                <div className="font-bold text-zinc-900">{turnoLabel(session?.turno || order.turnoInicial)}</div>
              </div>
            </div>
            <button className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-sm font-medium transition-colors">
              🔄 Trocar Máquina
            </button>
          </div>
        </div>

        {/* Balanço de Massa */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">📊 Balanço de Massa</h2>
          
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="text-center p-4 bg-zinc-50 rounded-xl">
              <div className="text-sm text-zinc-500">Bobina</div>
              <div className="text-2xl font-bold text-zinc-900">{Number(order.bobinaPesoInicial).toFixed(1)} kg</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <div className="text-sm text-green-600">Produzido</div>
              <div className="text-2xl font-bold text-green-700">{Number(order.pesoTotalProduzido).toFixed(1)} kg</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-xl">
              <div className="text-sm text-red-600">Apara</div>
              <div className="text-2xl font-bold text-red-700">{Number(order.totalApara).toFixed(1)} kg</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <div className="text-sm text-blue-600">Restante</div>
              <div className="text-2xl font-bold text-blue-700">{pesoRestante.toFixed(1)} kg</div>
            </div>
          </div>

          {/* Barra de Progresso */}
          <div>
            <div className="flex justify-between text-sm text-zinc-500 mb-2">
              <span>Progresso</span>
              <span>{progresso}%</span>
            </div>
            <div className="h-4 bg-zinc-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all"
                style={{ width: `${progresso}%` }}
              />
            </div>
          </div>
        </div>

        {/* Peso Total */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">⚖️ Peso Total Produzido</h2>
          <div className="flex gap-4">
            <input
              type="number"
              step="0.1"
              value={pesoForm.peso}
              onChange={(e) => setPesoForm({ peso: e.target.value })}
              placeholder="Peso total em kg"
              className="flex-1 px-4 py-3 border border-zinc-300 rounded-lg text-xl font-bold focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
            />
            <button
              onClick={handleUpdatePeso}
              className="px-6 py-3 bg-[#FFD700] hover:bg-[#E6C200] rounded-lg font-medium transition-colors"
            >
              Atualizar
            </button>
          </div>
          <p className="text-sm text-zinc-500 mt-2">
            Pacotes gerados: {order.totalPacotes} ({order.totalUnidades} unidades)
          </p>
        </div>

        {/* Aparas Lançadas */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-900">🗑️ Aparas Lançadas</h2>
            <span className="text-lg font-bold text-red-600">Total: {Number(order.totalApara).toFixed(1)} kg</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {order.aparas.map((apara) => (
              <div key={apara.id} className="px-3 py-2 bg-red-50 rounded-lg text-sm">
                <span className="font-bold text-red-700">{Number(apara.peso).toFixed(1)} kg</span>
                <span className="text-red-500 ml-2">{new Date(apara.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ))}
            {order.aparas.length === 0 && (
              <div className="text-zinc-400 text-sm">Nenhuma apara lançada</div>
            )}
          </div>
        </div>

        {/* Ações */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setShowAparaModal(true)}
            className="flex items-center justify-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 py-4 rounded-xl font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Lançar Apara
          </button>
          <button
            onClick={() => setShowPacoteModal(true)}
            className="flex items-center justify-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 py-4 rounded-xl font-medium transition-colors"
          >
            <Package className="w-5 h-5" />
            Gerar Pacote / Etiqueta
          </button>
          <button
            onClick={() => setShowParadaModal(true)}
            className="flex items-center justify-center gap-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 py-4 rounded-xl font-medium transition-colors"
          >
            <Pause className="w-5 h-5" />
            Registrar Parada
          </button>
          <button
            onClick={() => setShowFinalizarModal(true)}
            className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl font-medium transition-colors"
          >
            <CheckCircle className="w-5 h-5" />
            Finalizar OP
          </button>
        </div>

        {/* Modal Apara */}
        {showAparaModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-bold text-zinc-900 mb-4">Lançar Apara</h3>
              <input
                type="number"
                step="0.1"
                value={aparaForm.peso}
                onChange={(e) => setAparaForm({ peso: e.target.value })}
                placeholder="Peso da apara (kg)"
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg text-xl font-bold focus:ring-2 focus:ring-[#FFD700] focus:border-transparent mb-4"
                autoFocus
              />
              <div className="flex gap-4">
                <button
                  onClick={() => setShowAparaModal(false)}
                  className="flex-1 px-4 py-3 bg-zinc-100 hover:bg-zinc-200 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleLancarApara}
                  className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium"
                >
                  Lançar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Pacote */}
        {showPacoteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-bold text-zinc-900 mb-4">Gerar Pacote</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-700 mb-2">Quantidade</label>
                <div className="flex gap-4">
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      name="quantidade"
                      value={1000}
                      checked={pacoteForm.quantidade === 1000}
                      onChange={() => setPacoteForm({ quantidade: 1000 })}
                      className="sr-only"
                    />
                    <div className={`p-4 rounded-xl border-2 text-center ${pacoteForm.quantidade === 1000 ? 'border-[#FFD700] bg-yellow-50' : 'border-zinc-200'}`}>
                      <div className="text-2xl font-bold">1000</div>
                      <div className="text-sm text-zinc-500">unidades</div>
                    </div>
                  </label>
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      name="quantidade"
                      value={500}
                      checked={pacoteForm.quantidade === 500}
                      onChange={() => setPacoteForm({ quantidade: 500 })}
                      className="sr-only"
                    />
                    <div className={`p-4 rounded-xl border-2 text-center ${pacoteForm.quantidade === 500 ? 'border-[#FFD700] bg-yellow-50' : 'border-zinc-200'}`}>
                      <div className="text-2xl font-bold">500</div>
                      <div className="text-sm text-zinc-500">unidades</div>
                    </div>
                  </label>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowPacoteModal(false)}
                  className="flex-1 px-4 py-3 bg-zinc-100 hover:bg-zinc-200 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGerarPacote}
                  className="flex-1 px-4 py-3 bg-[#FFD700] hover:bg-[#E6C200] rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  <Printer className="w-5 h-5" />
                  Gerar Etiqueta
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Finalizar */}
        {showFinalizarModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-bold text-zinc-900 mb-4">Finalizar Ordem de Produção</h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-yellow-800 text-sm">
                  Ao finalizar, a ordem será enviada para conferência. Certifique-se de que todos os dados estão corretos.
                </p>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Peso Total:</span>
                  <span className="font-bold">{Number(order.pesoTotalProduzido).toFixed(1)} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Apara Total:</span>
                  <span className="font-bold">{Number(order.totalApara).toFixed(1)} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Pacotes:</span>
                  <span className="font-bold">{order.totalPacotes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Unidades:</span>
                  <span className="font-bold">{order.totalUnidades}</span>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowFinalizarModal(false)}
                  className="flex-1 px-4 py-3 bg-zinc-100 hover:bg-zinc-200 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleFinalizar}
                  className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Parada (simplificado) */}
        {showParadaModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-bold text-zinc-900 mb-4">Registrar Parada</h3>
              <p className="text-zinc-500 mb-4">Selecione o tipo de parada:</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { tipo: 'ALMOCO', label: '🍽️ Almoço' },
                  { tipo: 'MANUTENCAO', label: '🔧 Manutenção' },
                  { tipo: 'BANHEIRO', label: '🚽 Banheiro' },
                  { tipo: 'SETUP', label: '⚙️ Setup' },
                  { tipo: 'FALTA_BOBINA', label: '📦 Falta Bobina' },
                  { tipo: 'OUTROS', label: '❓ Outros' },
                ].map((p) => (
                  <button
                    key={p.tipo}
                    onClick={() => {
                      alert(`Parada "${p.label}" registrada!`)
                      setShowParadaModal(false)
                    }}
                    className="p-4 bg-yellow-50 hover:bg-yellow-100 rounded-xl text-center font-medium"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowParadaModal(false)}
                className="w-full px-4 py-3 bg-zinc-100 hover:bg-zinc-200 rounded-lg font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
