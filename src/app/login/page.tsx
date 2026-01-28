'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Package, User, Lock, AlertCircle } from 'lucide-react'

import { createSupabaseBrowserClient } from '@/lib/supabase/browser'

export default function LoginPage() {
  const [nextPath, setNextPath] = useState('/dashboard')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  useEffect(() => {
    const url = new URL(window.location.href)
    const next = url.searchParams.get('next')
    if (next && next.startsWith('/')) {
      setNextPath(next)
    }
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (signInError) {
        setError(signInError.message)
        return
      }

      // Buscar role do usuário no banco
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const response = await fetch('/api/user/me')
        const userData = await response.json()
        
        // Redirecionar baseado na role
        if (userData.role === 'ADMIN' || userData.role === 'OWNER') {
          window.location.href = '/dashboard'
        } else if (userData.role === 'EXPEDICAO' || userData.role === 'OPERATOR') {
          window.location.href = '/expedicao/retirada'
        } else if (userData.role === 'CORTE_SOLDA') {
          window.location.href = '/producao'
        } else if (userData.role === 'VENDAS' || userData.role === 'FINANCEIRO') {
          window.location.href = '/admin/relatorios/retiradas'
        } else {
          window.location.href = nextPath
        }
      } else {
        window.location.href = nextPath
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-[#FFD700] rounded-2xl flex items-center justify-center">
            <Package className="w-8 h-8 text-zinc-900" />
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-8 shadow-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-zinc-900">Bem-vindo</h1>
            <p className="text-zinc-600 mt-2">Entre com sua conta para continuar</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-900">Email</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent transition-all"
                  placeholder="seuemail@exemplo.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-900">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                />
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
                  <span>Entrando...</span>
                </>
              ) : (
                <span>Entrar</span>
              )}
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-zinc-600">
            Precisa de uma conta? Entre em contato com o administrador.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
