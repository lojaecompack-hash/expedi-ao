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
  turnoInicial: string
  pesoTotalProduzido: number | null
  totalApara: number
  totalPacotes: number | null
  totalUnidades: number | null
  status: string
  bobinas: Array<{
    id: string
    sequencia: number
    bobinaSku: string
    pesoInicial: number
    pesoRestante: number | null
    bobinaOrigem: string
    inicioAt: string
    fimAt: string | null
  }>
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
  const [showTrocarBobinaModal, setShowTrocarBobinaModal] = useState(false)
  
  // Formulários
  const [aparaForm, setAparaForm] = useState({ peso: '' })
  const [pacoteForm, setPacoteForm] = useState({ quantidade: 1000 })
  const [finalizarForm, setFinalizarForm] = useState({ peso: '', pacotes: '', unidades: '' })
  const [trocarBobinaForm, setTrocarBobinaForm] = useState({
    pesoRestante: '',
    novaBobinaSku: '',
    novaBobinaPeso: '',
    novaBobinaOrigem: 'EXTRUSORA'
  })

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

  const handleTrocarBobina = async () => {
    if (!trocarBobinaForm.novaBobinaPeso) {
      alert('Informe o peso da nova bobina')
      return
    }
    
    if (!bobinaAtual) {
      alert('Nenhuma bobina ativa encontrada')
      return
    }
    
    try {
      const res = await fetch(`/api/production/orders/${id}/trocar-bobina`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pesoRestante: parseFloat(trocarBobinaForm.pesoRestante) || 0,
          novaBobinaSku: bobinaAtual.bobinaSku, // Usa o mesmo SKU da bobina atual
          novaBobinaPeso: parseFloat(trocarBobinaForm.novaBobinaPeso),
          novaBobinaOrigem: trocarBobinaForm.novaBobinaOrigem
        })
      })
      
      const data = await res.json()
      if (data.ok) {
        alert('Bobina trocada com sucesso!')
        setShowTrocarBobinaModal(false)
        setTrocarBobinaForm({
          pesoRestante: '',
          novaBobinaSku: '',
          novaBobinaPeso: '',
          novaBobinaOrigem: 'EXTRUSORA'
        })
        fetchOrder()
      } else {
        alert(data.error)
      }
    } catch (error) {
      console.error('Erro ao trocar bobina:', error)
      alert('Erro ao trocar bobina')
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
    if (!finalizarForm.peso || !finalizarForm.pacotes || !finalizarForm.unidades) {
      alert('Preencha todos os campos obrigatórios')
      return
    }
    
    try {
      const res = await fetch(`/api/production/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'FINALIZAR',
          pesoTotalProduzido: parseFloat(finalizarForm.peso),
          totalPacotes: parseInt(finalizarForm.pacotes),
          totalUnidades: parseInt(finalizarForm.unidades)
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
  const totalBobinas = order.bobinas?.reduce((acc, b) => acc + Number(b.pesoInicial), 0) || 0
  const bobinaAtual = order.bobinas?.find(b => !b.fimAt)
  const pesoUsado = Number(order.pesoTotalProduzido || 0) + Number(order.totalApara)
  const progresso = totalBobinas > 0 ? Math.min(100, Math.round((pesoUsado / totalBobinas) * 100)) : 0

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
        </div>

        {/* Bobinas Utilizadas */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-900">🎞️ Bobinas Utilizadas</h2>
            <button
              onClick={() => setShowTrocarBobinaModal(true)}
              className="px-4 py-2 bg-[#FFD700] hover:bg-[#E6C200] rounded-lg text-sm font-medium transition-colors"
            >
              ➕ Trocar Bobina
            </button>
          </div>
          
          <div className="space-y-2 mb-4">
            {order.bobinas.map((bobina) => (
              <div key={bobina.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <span className="font-bold text-zinc-900">#{bobina.sequencia}</span>
                  <span className="text-zinc-600">{bobina.bobinaSku}</span>
                  <span className="text-sm text-zinc-500">
                    {Number(bobina.pesoInicial).toFixed(1)}kg
                    {bobina.pesoRestante !== null && ` → ${Number(bobina.pesoRestante).toFixed(1)}kg`}
                  </span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  bobina.fimAt 
                    ? 'bg-zinc-200 text-zinc-600' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {bobina.fimAt ? '✅ Finalizada' : '🟢 Em Uso'}
                </span>
              </div>
            ))}
          </div>
          
          <div className="pt-4 border-t border-zinc-200">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-zinc-500">Total de bobinas:</span>
                <span className="font-bold ml-2">{order.bobinas.length}</span>
              </div>
              <div>
                <span className="text-zinc-500">Peso total:</span>
                <span className="font-bold ml-2">{totalBobinas.toFixed(1)} kg</span>
              </div>
              <div>
                <span className="text-zinc-500">Progresso:</span>
                <span className="font-bold ml-2">{progresso}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Balanço de Massa */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">📊 Balanço de Massa</h2>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 bg-zinc-50 rounded-xl">
              <div className="text-sm text-zinc-500">Bobinas (Total)</div>
              <div className="text-2xl font-bold text-zinc-900">{totalBobinas.toFixed(1)} kg</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <div className="text-sm text-green-600">Produzido</div>
              <div className="text-2xl font-bold text-green-700">{Number(order.pesoTotalProduzido || 0).toFixed(1)} kg</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-xl">
              <div className="text-sm text-red-600">Apara</div>
              <div className="text-2xl font-bold text-red-700">{Number(order.totalApara).toFixed(1)} kg</div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            ℹ️ Peso e quantidade serão lançados ao finalizar a OP
          </div>
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

        {/* Modal Trocar Bobina */}
        {showTrocarBobinaModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-bold text-zinc-900 mb-4">🔄 Trocar Bobina</h3>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Bobina Atual</p>
                    <p className="text-lg font-bold text-blue-900">{bobinaAtual?.bobinaSku || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Peso Inicial</p>
                    <p className="text-lg font-bold text-blue-900">{Number(bobinaAtual?.pesoInicial || 0).toFixed(1)} kg</p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-yellow-800 text-sm">
                  ⚠️ A nova bobina deve ser da <strong>mesma medida</strong> ({order.productMeasure}). Para trocar de medida, finalize esta OP e crie uma nova.
                </p>
              </div>
              
              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Peso Restante da Bobina Atual (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={trocarBobinaForm.pesoRestante}
                    onChange={(e) => setTrocarBobinaForm({ ...trocarBobinaForm, pesoRestante: e.target.value })}
                    placeholder="Ex: 5.0"
                    className="w-full px-4 py-2 border border-zinc-300 rounded-lg"
                  />
                  <p className="text-xs text-zinc-500 mt-1">Deixe em branco se a bobina acabou completamente</p>
                </div>
                
                <div className="border-t border-zinc-200 pt-4">
                  <h4 className="font-medium text-zinc-900 mb-3">Nova Bobina (mesma medida):</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">
                        Peso da Nova Bobina (kg) *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={trocarBobinaForm.novaBobinaPeso}
                        onChange={(e) => setTrocarBobinaForm({ ...trocarBobinaForm, novaBobinaPeso: e.target.value })}
                        placeholder="Ex: 100"
                        className="w-full px-4 py-2 border border-zinc-300 rounded-lg"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-2">
                        Origem
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="origem"
                            value="EXTRUSORA"
                            checked={trocarBobinaForm.novaBobinaOrigem === 'EXTRUSORA'}
                            onChange={(e) => setTrocarBobinaForm({ ...trocarBobinaForm, novaBobinaOrigem: e.target.value })}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">Extrusora</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="origem"
                            value="TERCEIRO"
                            checked={trocarBobinaForm.novaBobinaOrigem === 'TERCEIRO'}
                            onChange={(e) => setTrocarBobinaForm({ ...trocarBobinaForm, novaBobinaOrigem: e.target.value })}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">Terceiro</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={() => setShowTrocarBobinaModal(false)}
                  className="flex-1 px-4 py-3 bg-zinc-100 hover:bg-zinc-200 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleTrocarBobina}
                  className="flex-1 px-4 py-3 bg-[#FFD700] hover:bg-[#E6C200] rounded-lg font-medium"
                >
                  ✅ Trocar e Continuar
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
              
              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Peso Total Produzido (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={finalizarForm.peso}
                    onChange={(e) => setFinalizarForm({ ...finalizarForm, peso: e.target.value })}
                    placeholder="Ex: 2000.0"
                    className="w-full px-4 py-2 border border-zinc-300 rounded-lg"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Quantidade de Pacotes *
                  </label>
                  <input
                    type="number"
                    value={finalizarForm.pacotes}
                    onChange={(e) => setFinalizarForm({ ...finalizarForm, pacotes: e.target.value })}
                    placeholder="Ex: 100"
                    className="w-full px-4 py-2 border border-zinc-300 rounded-lg"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    Quantidade de Unidades *
                  </label>
                  <input
                    type="number"
                    value={finalizarForm.unidades}
                    onChange={(e) => setFinalizarForm({ ...finalizarForm, unidades: e.target.value })}
                    placeholder="Ex: 100000"
                    className="w-full px-4 py-2 border border-zinc-300 rounded-lg"
                    required
                  />
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-yellow-800 text-sm">
                  ⚠️ Após finalizar, a ordem será enviada para conferência.
                </p>
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
