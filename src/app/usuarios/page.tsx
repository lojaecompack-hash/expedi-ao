'use client'

import { useState, useEffect } from 'react'
import MainLayout from '@/components/MainLayout'
import { useRouter } from 'next/navigation'
import { Eye, Trash2 } from 'lucide-react'

interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'EXPEDICAO' | 'PRODUCAO'
  isActive: boolean
}

export default function UsuariosPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    role: 'EXPEDICAO' as 'ADMIN' | 'EXPEDICAO' | 'PRODUCAO'
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      if (data.ok) {
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      const res = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      // Verificar se a resposta é válida
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Erro desconhecido' }))
        alert(errorData.error || `Erro HTTP ${res.status}`)
        return
      }

      const data = await res.json()

      if (data.ok) {
        alert('Usuário criado com sucesso!')
        setFormData({ email: '', name: '', password: '', role: 'EXPEDICAO' })
        fetchUsers()
      } else {
        alert(data.error || 'Erro ao criar usuário')
      }
    } catch (error) {
      console.error('Erro ao criar usuário:', error)
      alert('Erro ao criar usuário. Verifique se o usuário foi criado antes de tentar novamente.')
      // Atualizar lista mesmo em caso de erro, pois o usuário pode ter sido criado
      fetchUsers()
    } finally {
      setCreating(false)
    }
  }

  const handleDeactivate = async (userId: string) => {
    if (!confirm('Deseja realmente desativar este usuário?')) return

    try {
      const res = await fetch('/api/users/deactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      const data = await res.json()

      if (data.ok) {
        alert('Usuário desativado com sucesso!')
        fetchUsers()
      } else {
        alert(data.error || 'Erro ao desativar usuário')
      }
    } catch (error) {
      console.error('Erro ao desativar usuário:', error)
      alert('Erro ao desativar usuário')
    }
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">👤 Usuários do Sistema</h1>
          <p className="text-zinc-600 mt-2">Gerencie usuários e suas permissões</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-zinc-600">Carregando...</div>
        ) : (
          <>
            {/* Lista de Usuários */}
            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-50 border-b border-zinc-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Usuário
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-zinc-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-zinc-200 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-zinc-700">
                                {user.email[0].toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-zinc-900">{user.name}</div>
                              <div className="text-sm text-zinc-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'ADMIN' 
                              ? 'bg-purple-100 text-purple-800' 
                              : user.role === 'PRODUCAO'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role === 'ADMIN' ? 'Administrador' : user.role === 'PRODUCAO' ? 'Produção' : 'Expedição'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => router.push(`/usuarios/${user.id}`)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              Ver
                            </button>
                            {user.isActive && user.role !== 'ADMIN' && (
                              <button
                                onClick={() => handleDeactivate(user.id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                                Desativar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Formulário de Criação */}
            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
              <h2 className="text-xl font-semibold text-zinc-900 mb-6">📝 Criar Novo Usuário</h2>
              
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
                    placeholder="usuario@exemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    Nome
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
                    placeholder="Nome completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    Senha
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    Tipo de Usuário
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value="ADMIN"
                        checked={formData.role === 'ADMIN'}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'EXPEDICAO' | 'PRODUCAO' })}
                        className="w-4 h-4 text-[#FFD700] focus:ring-[#FFD700]"
                      />
                      <span className="text-sm text-zinc-700">ADMIN</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value="EXPEDICAO"
                        checked={formData.role === 'EXPEDICAO'}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'EXPEDICAO' | 'PRODUCAO' })}
                        className="w-4 h-4 text-[#FFD700] focus:ring-[#FFD700]"
                      />
                      <span className="text-sm text-zinc-700">EXPEDIÇÃO</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value="PRODUCAO"
                        checked={formData.role === 'PRODUCAO'}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'EXPEDICAO' | 'PRODUCAO' })}
                        className="w-4 h-4 text-[#FFD700] focus:ring-[#FFD700]"
                      />
                      <span className="text-sm text-zinc-700">PRODUÇÃO</span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={creating}
                  className="w-full bg-[#FFD700] text-zinc-900 font-medium py-3 px-4 rounded-lg hover:bg-[#FFC700] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Criando...' : '✅ Criar Usuário'}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  )
}
