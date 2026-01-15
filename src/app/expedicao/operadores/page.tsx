"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Users, Plus, Edit2, Trash2, Check, X, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Sidebar from "@/components/Sidebar"

interface Operator {
  id: string
  name: string
  email: string | null
  phone: string | null
  isActive: boolean
  createdAt: string
}

export default function OperadoresPage() {
  const [operators, setOperators] = useState<Operator[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Form states
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    fetchOperators()
  }, [])

  const fetchOperators = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/operators')
      const data = await res.json()
      
      if (data.ok) {
        setOperators(data.operators)
      }
    } catch (error) {
      console.error('Erro ao buscar operadores:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    try {
      const url = editingId ? '/api/operators' : '/api/operators'
      const method = editingId ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId,
          name,
          email: email || null,
          phone: phone || null
        })
      })

      const data = await res.json()

      if (data.ok) {
        setSuccess(editingId ? 'Operador atualizado!' : 'Operador criado!')
        setName("")
        setEmail("")
        setPhone("")
        setEditingId(null)
        setShowForm(false)
        fetchOperators()
      } else {
        setError(data.error || 'Erro ao salvar operador')
      }
    } catch (err) {
      setError('Erro de conexão')
    }
  }

  const handleEdit = (operator: Operator) => {
    setEditingId(operator.id)
    setName(operator.name)
    setEmail(operator.email || "")
    setPhone(operator.phone || "")
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este operador?')) return

    try {
      const res = await fetch(`/api/operators?id=${id}`, {
        method: 'DELETE'
      })

      const data = await res.json()

      if (data.ok) {
        setSuccess('Operador excluído!')
        fetchOperators()
      } else {
        setError(data.error || 'Erro ao excluir operador')
      }
    } catch (err) {
      setError('Erro de conexão')
    }
  }

  const handleToggleActive = async (operator: Operator) => {
    try {
      const res = await fetch('/api/operators', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: operator.id,
          isActive: !operator.isActive
        })
      })

      const data = await res.json()

      if (data.ok) {
        setSuccess(operator.isActive ? 'Operador desativado!' : 'Operador ativado!')
        fetchOperators()
      } else {
        setError(data.error || 'Erro ao atualizar status')
      }
    } catch (err) {
      setError('Erro de conexão')
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setName("")
    setEmail("")
    setPhone("")
    setError("")
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Sidebar />

      {/* Main Content */}
      <div className="ml-64 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/expedicao/retirada" className="p-2 hover:bg-zinc-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-zinc-600" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-zinc-900">Gerenciar Operadores</h1>
                <p className="text-zinc-600 mt-1">Cadastre os operadores da expedição</p>
              </div>
            </div>

            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 bg-[#FFD700] text-zinc-900 font-semibold py-3 px-6 rounded-xl hover:bg-[#FFC700] transition-all"
              >
                <Plus className="w-5 h-5" />
                <span>Novo Operador</span>
              </button>
            )}
          </div>

          {/* Messages */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700"
            >
              {success}
            </motion.div>
          )}

          {/* Form */}
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-zinc-200 p-8 shadow-sm"
            >
              <h2 className="text-xl font-bold text-zinc-900 mb-6">
                {editingId ? 'Editar Operador' : 'Novo Operador'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-900">Nome *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
                      placeholder="Ex: João Silva"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-900">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
                      placeholder="exemplo@email.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-900">Telefone</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-[#FFD700] text-zinc-900 font-semibold py-3 px-6 rounded-xl hover:bg-[#FFC700] transition-all"
                  >
                    <Check className="w-5 h-5" />
                    <span>{editingId ? 'Atualizar' : 'Salvar'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex items-center gap-2 bg-zinc-100 text-zinc-700 font-semibold py-3 px-6 rounded-xl hover:bg-zinc-200 transition-all"
                  >
                    <X className="w-5 h-5" />
                    <span>Cancelar</span>
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Lista de Operadores */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm"
          >
            {loading ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-zinc-600 mt-4">Carregando operadores...</p>
              </div>
            ) : operators.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
                <p className="text-zinc-600">Nenhum operador cadastrado</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-4 text-[#FFD700] hover:underline"
                >
                  Cadastrar primeiro operador
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-50 border-b border-zinc-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Nome</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Telefone</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-900">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {operators.map((operator) => (
                      <tr key={operator.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-medium text-zinc-900">{operator.name}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-zinc-600">{operator.email || '-'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-zinc-600">{operator.phone || '-'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleActive(operator)}
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium ${
                              operator.isActive
                                ? 'bg-green-100 text-green-700'
                                : 'bg-zinc-100 text-zinc-600'
                            }`}
                          >
                            {operator.isActive ? '✓ Ativo' : '✕ Inativo'}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(operator)}
                              className="p-2 text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(operator.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
