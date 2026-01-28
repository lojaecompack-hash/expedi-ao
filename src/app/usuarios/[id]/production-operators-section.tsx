'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'

interface ProductionOperator {
  id: string
  name: string
  type: 'CORTE_SOLDA'
  email: string | null
  phone: string | null
  isActive: boolean
}

interface ProductionOperatorsSectionProps {
  userId: string
  operators: ProductionOperator[]
  onRefresh: () => void
}

export default function ProductionOperatorsSection({ 
  userId, 
  operators, 
  onRefresh 
}: ProductionOperatorsSectionProps) {
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    name: '',
    type: 'CORTE_SOLDA' as 'CORTE_SOLDA',
    email: '',
    phone: '',
    password: ''
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      const res = await fetch(`/api/users/${userId}/production-operators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      const data = await res.json()

      if (data.ok) {
        alert('Operador de produção criado com sucesso!')
        setForm({ name: '', type: 'CORTE_SOLDA', email: '', phone: '', password: '' })
        onRefresh()
      } else {
        alert(`Erro: ${data.error}`)
      }
    } catch (error) {
      alert(`Erro ao criar operador: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (operatorId: string) => {
    if (!confirm('Deseja realmente excluir este operador?')) return

    try {
      const res = await fetch(`/api/production-operators/${operatorId}`, {
        method: 'DELETE'
      })

      const data = await res.json()

      if (data.ok) {
        alert('Operador excluído com sucesso!')
        onRefresh()
      } else {
        alert(data.error || 'Erro ao excluir operador')
      }
    } catch {
      alert('Erro ao excluir operador')
    }
  }

  // Operadores de Corte e Solda
  const corteSoldaOps = operators.filter(op => op.type === 'CORTE_SOLDA')

  return (
    <div className="space-y-6">
      {/* Listagem de Operadores */}
      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
        <h2 className="text-xl font-semibold text-zinc-900 mb-6">👷 Operadores de Produção</h2>
        
        {operators.length === 0 ? (
          <p className="text-zinc-500 text-center py-8">Nenhum operador cadastrado</p>
        ) : (
          <div className="space-y-6">
            {/* Corte e Solda */}
            {corteSoldaOps.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-zinc-700 mb-3">🔧 Corte e Solda ({corteSoldaOps.length})</h3>
                <div className="space-y-2">
                  {corteSoldaOps.map((op) => (
                    <div key={op.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div>
                        <p className="font-medium text-zinc-900">{op.name}</p>
                        {op.email && <p className="text-sm text-zinc-600">{op.email}</p>}
                        {op.phone && <p className="text-sm text-zinc-600">{op.phone}</p>}
                      </div>
                      <button
                        onClick={() => handleDelete(op.id)}
                        className="text-red-600 hover:text-red-700 p-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* Formulário de Criação */}
      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
        <h2 className="text-xl font-semibold text-zinc-900 mb-6">📝 Adicionar Operador de Produção</h2>
        
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Nome *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
              placeholder="Nome do operador"
            />
          </div>


          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Email (opcional)
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
              placeholder="email@exemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Telefone (opcional)
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
              placeholder="(00) 00000-0000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Senha *
            </label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
              placeholder="Mínimo 4 caracteres"
              minLength={4}
            />
            <p className="text-xs text-zinc-500 mt-1">Senha para validar ações de produção</p>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="w-full bg-[#FFD700] text-zinc-900 font-medium py-3 px-4 rounded-lg hover:bg-[#FFC700] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? 'Adicionando...' : '✅ Adicionar Operador'}
          </button>
        </form>
      </div>
    </div>
  )
}
