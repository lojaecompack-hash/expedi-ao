'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import MainLayout from '@/components/MainLayout'
import TinyProductSearch from '@/components/TinyProductSearch'
import { ArrowLeft, Package } from 'lucide-react'
import Link from 'next/link'

interface ProductionOperator {
  id: string
  name: string
  type: string
}

interface Machine {
  id: string
  code: string
  name: string
}

function NovaOPContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedMachineId = searchParams.get('machine')

  const [machines, setMachines] = useState<Machine[]>([])
  const [operators, setOperators] = useState<ProductionOperator[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  const [formData, setFormData] = useState({
    productSku: '',
    productName: '',
    productMeasure: '',
    bobinaSku: '',
    bobinaPesoInicial: '',
    bobinaOrigem: 'EXTRUSORA',
    turnoInicial: getTurnoAtual(),
    machineId: preselectedMachineId || '',
    operatorId: '',
    operatorName: ''
  })

  function getTurnoAtual() {
    const hora = new Date().getHours()
    if (hora >= 6 && hora < 14) return 'MANHA'
    if (hora >= 14 && hora < 22) return 'TARDE'
    return 'NOITE'
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [machinesRes, operatorsRes] = await Promise.all([
        fetch('/api/production/machines'),
        fetch('/api/production-operators?type=CORTE_SOLDA')
      ])

      const machinesData = await machinesRes.json()
      const operatorsData = await operatorsRes.json()

      if (machinesData.ok) {
        // Filtrar apenas máquinas livres
        const livres = machinesData.machines.filter((m: { status: string }) => m.status === 'LIVRE')
        setMachines(livres)
      }

      if (operatorsData.ok) {
        setOperators(operatorsData.operators)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOperatorChange = (operatorId: string) => {
    const operator = operators.find(o => o.id === operatorId)
    setFormData({
      ...formData,
      operatorId,
      operatorName: operator?.name || ''
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      const res = await fetch('/api/production/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          bobinaPesoInicial: parseFloat(formData.bobinaPesoInicial)
        })
      })

      const data = await res.json()

      if (data.ok) {
        alert('Ordem de Produção criada com sucesso!')
        router.push(`/producao/op/${data.order.id}`)
      } else {
        alert(data.error || 'Erro ao criar OP')
      }
    } catch (error) {
      console.error('Erro ao criar OP:', error)
      alert('Erro ao criar OP')
    } finally {
      setCreating(false)
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

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/producao"
            className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Nova Ordem de Produção</h1>
            <p className="text-zinc-500">Inicie uma nova produção em uma máquina</p>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Produto */}
          <div className="bg-white rounded-xl border border-zinc-200 p-6">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Produto
            </h2>

            <div className="space-y-4">
              <TinyProductSearch
                value={formData.productSku}
                onChange={(sku, product) => {
                  setFormData({
                    ...formData,
                    productSku: sku,
                    productName: product?.nome || formData.productName
                  })
                }}
                label="SKU do Produto"
                placeholder="Digite o SKU para buscar"
              />

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Nome do Produto
                </label>
                <input
                  type="text"
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  placeholder="Ex: Envelope de Segurança ECO"
                  className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Medida
                </label>
                <input
                  type="text"
                  value={formData.productMeasure}
                  onChange={(e) => setFormData({ ...formData, productMeasure: e.target.value })}
                  placeholder="Ex: 19x25"
                  className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          {/* Bobina */}
          <div className="bg-white rounded-xl border border-zinc-200 p-6">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">🎞️ Bobina</h2>

            <div className="space-y-4">
              <TinyProductSearch
                value={formData.bobinaSku}
                onChange={(sku) => setFormData({ ...formData, bobinaSku: sku })}
                label="SKU da Bobina"
                placeholder="Digite o SKU da bobina"
              />

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Peso Inicial (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.bobinaPesoInicial}
                  onChange={(e) => setFormData({ ...formData, bobinaPesoInicial: e.target.value })}
                  placeholder="Ex: 100"
                  className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Origem da Bobina
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="bobinaOrigem"
                      value="EXTRUSORA"
                      checked={formData.bobinaOrigem === 'EXTRUSORA'}
                      onChange={(e) => setFormData({ ...formData, bobinaOrigem: e.target.value })}
                      className="w-4 h-4 text-[#FFD700] focus:ring-[#FFD700]"
                    />
                    <span className="text-sm text-zinc-700">Extrusora (Própria)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="bobinaOrigem"
                      value="TERCEIRO"
                      checked={formData.bobinaOrigem === 'TERCEIRO'}
                      onChange={(e) => setFormData({ ...formData, bobinaOrigem: e.target.value })}
                      className="w-4 h-4 text-[#FFD700] focus:ring-[#FFD700]"
                    />
                    <span className="text-sm text-zinc-700">Terceiro (Comprada)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Turno, Máquina e Operador */}
          <div className="bg-white rounded-xl border border-zinc-200 p-6">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">👷 Turno / Máquina / Operador</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Turno
                </label>
                <div className="flex gap-4">
                  {['MANHA', 'TARDE', 'NOITE'].map((t) => (
                    <label key={t} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="turno"
                        value={t}
                        checked={formData.turnoInicial === t}
                        onChange={(e) => setFormData({ ...formData, turnoInicial: e.target.value })}
                        className="w-4 h-4 text-[#FFD700] focus:ring-[#FFD700]"
                      />
                      <span className="text-sm text-zinc-700">
                        {t === 'MANHA' ? 'Manhã (6h-14h20)' : t === 'TARDE' ? 'Tarde (13h40-22h)' : 'Noite (22h-6h)'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Máquina
                </label>
                <select
                  value={formData.machineId}
                  onChange={(e) => setFormData({ ...formData, machineId: e.target.value })}
                  className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
                  required
                >
                  <option value="">Selecione uma máquina</option>
                  {machines.map((m) => (
                    <option key={m.id} value={m.id}>{m.code} - {m.name}</option>
                  ))}
                </select>
                {machines.length === 0 && (
                  <p className="text-sm text-red-500 mt-1">Nenhuma máquina livre disponível</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Operador
                </label>
                <select
                  value={formData.operatorId}
                  onChange={(e) => handleOperatorChange(e.target.value)}
                  className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
                  required
                >
                  <option value="">Selecione o operador</option>
                  {operators.map((op) => (
                    <option key={op.id} value={op.id}>{op.name}</option>
                  ))}
                </select>
                {operators.length === 0 && (
                  <p className="text-sm text-yellow-600 mt-1">
                    Nenhum operador cadastrado. <Link href="/usuarios" className="underline">Cadastrar operadores</Link>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Botão de Criar */}
          <button
            type="submit"
            disabled={creating || machines.length === 0}
            className="w-full bg-[#FFD700] hover:bg-[#E6C200] disabled:bg-zinc-300 disabled:cursor-not-allowed text-zinc-900 py-4 rounded-xl font-bold text-lg transition-colors"
          >
            {creating ? 'Criando...' : '▶️ INICIAR PRODUÇÃO'}
          </button>
        </form>
      </div>
    </MainLayout>
  )
}

export default function NovaOPPage() {
  return (
    <Suspense fallback={
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-zinc-500">Carregando...</div>
        </div>
      </MainLayout>
    }>
      <NovaOPContent />
    </Suspense>
  )
}
