'use client'

import { useState, useEffect } from 'react'
import MainLayout from '@/components/MainLayout'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Edit, Key, Trash2 } from 'lucide-react'
import ProductionOperatorsSection from './production-operators-section'

interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'EXPEDICAO' | 'PRODUCAO'
  isActive: boolean
}

interface Operator {
  id: string
  name: string
  email: string | null
  phone: string | null
  isActive: boolean
}

interface ProductionOperator {
  id: string
  name: string
  type: 'CORTE_SOLDA' | 'EXTRUSORA'
  email: string | null
  phone: string | null
  isActive: boolean
}

export default function UserDetailPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [operators, setOperators] = useState<Operator[]>([])
  const [productionOperators, setProductionOperators] = useState<ProductionOperator[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', role: '' as 'ADMIN' | 'EXPEDICAO' | 'PRODUCAO' })
  const [saving, setSaving] = useState(false)

  // Form state para criar operador
  const [operatorForm, setOperatorForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  })

  useEffect(() => {
    if (userId) {
      fetchUserDetails()
      fetchOperators()
      fetchProductionOperators()
    }
  }, [userId])

  const fetchUserDetails = async () => {
    try {
      const res = await fetch(`/api/users/${userId}`)
      const data = await res.json()
      if (data.ok) {
        setUser(data.user)
      }
    } catch (error) {
      console.error('Erro ao buscar usuário:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchOperators = async () => {
    try {
      const res = await fetch(`/api/users/${userId}/operators`)
      const data = await res.json()
      if (data.ok) {
        setOperators(data.operators)
      }
    } catch (error) {
      console.error('Erro ao buscar operadores:', error)
    }
  }

  const fetchProductionOperators = async () => {
    try {
      const res = await fetch(`/api/users/${userId}/production-operators`)
      const data = await res.json()
      if (data.ok) {
        setProductionOperators(data.operators)
      }
    } catch (error) {
      console.error('Erro ao buscar operadores de produção:', error)
    }
  }

  const handleCreateOperator = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      const res = await fetch(`/api/users/${userId}/operators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(operatorForm)
      })

      const data = await res.json()
      console.log('Response:', data)

      if (data.ok) {
        alert('Operador criado com sucesso!')
        setOperatorForm({ name: '', email: '', phone: '', password: '' })
        fetchOperators()
      } else {
        const errorMsg = data.error || 'Erro ao criar operador'
        console.error('Erro da API:', errorMsg)
        alert(`Erro ao criar operador: ${errorMsg}`)
      }
    } catch (error) {
      console.error('Erro ao criar operador:', error)
      alert(`Erro ao criar operador: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteOperator = async (operatorId: string) => {
    if (!confirm('Deseja realmente excluir este operador?')) return

    try {
      const res = await fetch(`/api/operators/${operatorId}`, {
        method: 'DELETE'
      })

      const data = await res.json()

      if (data.ok) {
        alert('Operador excluído com sucesso!')
        fetchOperators()
      } else {
        alert(data.error || 'Erro ao excluir operador')
      }
    } catch (error) {
      console.error('Erro ao excluir operador:', error)
      alert('Erro ao excluir operador')
    }
  }

  const handleOpenEditModal = () => {
    if (user) {
      setEditForm({ name: user.name, role: user.role })
      setShowEditModal(true)
    }
  }

  const handleSaveUser = async () => {
    if (!editForm.name.trim()) {
      alert('Nome é obrigatório')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })
      const data = await res.json()
      if (data.ok) {
        alert('Usuário atualizado com sucesso!')
        setShowEditModal(false)
        fetchUserDetails()
      } else {
        alert(data.error || 'Erro ao atualizar usuário')
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
      alert('Erro ao atualizar usuário')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center py-12 text-zinc-600">Carregando...</div>
      </MainLayout>
    )
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="text-center py-12 text-zinc-600">Usuário não encontrado</div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <button
            onClick={() => router.push('/usuarios')}
            className="inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <h1 className="text-3xl font-bold text-zinc-900">👤 {user.name}</h1>
          <p className="text-zinc-600 mt-2">{user.email}</p>
        </div>

        {/* Informações do Usuário */}
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-500 mb-1">Email</label>
              <div className="text-zinc-900">{user.email}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-500 mb-1">Tipo</label>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                user.role === 'ADMIN' 
                  ? 'bg-purple-100 text-purple-800' 
                  : user.role === 'PRODUCAO'
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {user.role === 'ADMIN' ? 'Administrador' : user.role === 'PRODUCAO' ? 'Produção' : 'Expedição'}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-500 mb-1">Status</label>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                user.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {user.isActive ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button 
              onClick={handleOpenEditModal}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
              Editar
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 text-sm text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors">
              <Key className="w-4 h-4" />
              Trocar Senha
            </button>
            {user.isActive && user.role !== 'ADMIN' && (
              <button className="inline-flex items-center gap-2 px-4 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
                Desativar
              </button>
            )}
          </div>
        </div>

        {/* Operadores - Apenas para usuários EXPEDIÇÃO */}
        {user.role === 'EXPEDICAO' && (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-zinc-900">👷 Operadores deste Usuário</h2>
              </div>

              {operators.length === 0 ? (
                <div className="px-6 py-12 text-center text-zinc-500">
                  Nenhum operador cadastrado
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-zinc-50 border-b border-zinc-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                          Nome
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                          Telefone
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {operators.map((operator) => (
                        <tr key={operator.id} className="hover:bg-zinc-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-zinc-200 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-zinc-700">
                                  {operator.name[0].toUpperCase()}
                                </span>
                              </div>
                              <span className="text-sm font-medium text-zinc-900">{operator.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-zinc-600">
                            {operator.email || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-zinc-600">
                            {operator.phone || '-'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleDeleteOperator(operator.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              Excluir
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Formulário de Criação de Operador */}
            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
              <h2 className="text-xl font-semibold text-zinc-900 mb-6">📝 Adicionar Operador</h2>
              
              <form onSubmit={handleCreateOperator} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    Nome *
                  </label>
                  <input
                    type="text"
                    required
                    value={operatorForm.name}
                    onChange={(e) => setOperatorForm({ ...operatorForm, name: e.target.value })}
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
                    value={operatorForm.email}
                    onChange={(e) => setOperatorForm({ ...operatorForm, email: e.target.value })}
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
                    value={operatorForm.phone}
                    onChange={(e) => setOperatorForm({ ...operatorForm, phone: e.target.value })}
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
                    value={operatorForm.password}
                    onChange={(e) => setOperatorForm({ ...operatorForm, password: e.target.value })}
                    className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
                    placeholder="Mínimo 4 caracteres"
                    minLength={4}
                  />
                  <p className="text-xs text-zinc-500 mt-1">Senha para validar retiradas</p>
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
          </>
        )}

        {/* Operadores de Produção - Apenas para usuários PRODUCAO */}
        {user.role === 'PRODUCAO' && (
          <ProductionOperatorsSection
            userId={userId}
            operators={productionOperators}
            onRefresh={fetchProductionOperators}
          />
        )}
      </div>

      {/* Modal de Edição de Usuário */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-zinc-900 mb-4">Editar Usuário</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Nome</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">Tipo</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value as 'ADMIN' | 'EXPEDICAO' | 'PRODUCAO' })}
                  className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
                >
                  <option value="ADMIN">Administrador</option>
                  <option value="EXPEDICAO">Expedição</option>
                  <option value="PRODUCAO">Produção</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveUser}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-[#FFD700] text-zinc-900 rounded-lg hover:bg-[#FFC700] transition-colors disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}
