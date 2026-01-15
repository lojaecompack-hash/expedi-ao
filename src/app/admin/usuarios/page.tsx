"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Package, User, Users, Plus, Eye, EyeOff, AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function UsuariosPage() {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"ADMIN" | "EXPEDICAO">("EXPEDICAO")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>("")
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult("")
    setSuccess(false)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          password,
          role
        }),
      })

      const data = await res.json()

      if (res.ok && data.ok) {
        setSuccess(true)
        setResult(`✅ Usuário criado com sucesso!\n\nEmail: ${data.user.email}\nNome: ${data.user.name}\nRole: ${data.user.role}`)
        setEmail("")
        setName("")
        setPassword("")
        setRole("EXPEDICAO")
      } else {
        setSuccess(false)
        setResult(`❌ Erro ao criar usuário\n\n${data.error || "Erro desconhecido"}`)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido"
      setSuccess(false)
      setResult(`❌ Erro de conexão\n\n${msg}`)
    } finally {
      setLoading(false)
    }
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
            <Package className="w-5 h-5" />
            <span className="font-medium">Expedição</span>
          </Link>
          <Link href="/admin/relatorios/retiradas" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-100 text-zinc-700 transition-colors">
            <Package className="w-5 h-5" />
            <span className="font-medium">Relatórios</span>
          </Link>
          <Link href="/admin/usuarios" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#FFD700] text-zinc-900">
            <Users className="w-5 h-5" />
            <span className="font-medium">Usuários</span>
          </Link>
          <Link href="/setup/tiny" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-100 text-zinc-700 transition-colors">
            <Package className="w-5 h-5" />
            <span className="font-medium">Configurações</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="ml-64 p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-zinc-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-zinc-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-zinc-900">Criar Usuário</h1>
              <p className="text-zinc-600 mt-1">Adicionar novo usuário ao sistema</p>
            </div>
          </div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-zinc-200 p-8 shadow-sm"
          >
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-900">Nome completo</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent transition-all"
                      placeholder="Ex: João Silva"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-900">Email</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent transition-all"
                      placeholder="exemplo@email.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-900">Senha</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent transition-all"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-900">Tipo de Usuário</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as "ADMIN" | "EXPEDICAO")}
                    className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent transition-all"
                  >
                    <option value="EXPEDICAO">EXPEDIÇÃO</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                  <p className="text-xs text-zinc-500">
                    {role === "ADMIN" 
                      ? "Acesso completo ao sistema, relatórios e configurações" 
                      : "Acesso apenas à expedição e retirada de pedidos"}
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#FFD700] text-zinc-900 font-semibold py-3 px-6 rounded-xl hover:bg-[#FFC700] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
                    <span>Criando usuário...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    <span>Criar Usuário</span>
                  </>
                )}
              </button>
            </form>

            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg border ${
                  success 
                    ? "bg-green-50 border-green-200 text-green-800" 
                    : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                <div className="flex items-start gap-3">
                  {success ? (
                    <Plus className="w-5 h-5 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 mt-0.5" />
                  )}
                  <pre className="whitespace-pre-wrap text-sm">{result}</pre>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
