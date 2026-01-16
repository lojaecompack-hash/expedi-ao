'use client'

import { useState } from 'react'
import { Lock, X } from 'lucide-react'

interface PasswordValidationModalProps {
  operatorId: string
  operatorName: string
  onValidate: () => void
  onCancel: () => void
}

export default function PasswordValidationModal({
  operatorId,
  operatorName,
  onValidate,
  onCancel
}: PasswordValidationModalProps) {
  const [password, setPassword] = useState('')
  const [validating, setValidating] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidating(true)
    setError('')

    try {
      const res = await fetch('/api/operators/validate-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operatorId, password })
      })

      const data = await res.json()

      if (data.ok) {
        onValidate()
      } else {
        setError(data.error || 'Senha incorreta')
      }
    } catch {
      setError('Erro ao validar senha')
    } finally {
      setValidating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FFD700]/20 rounded-xl flex items-center justify-center">
              <Lock className="w-5 h-5 text-[#FFD700]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-zinc-900">Validar Operador</h3>
              <p className="text-sm text-zinc-600">{operatorName}</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              Digite sua senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
              placeholder="••••"
              required
              autoFocus
              minLength={4}
            />
            {error && (
              <p className="text-sm text-red-600 mt-2">{error}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 border border-zinc-300 text-zinc-700 rounded-lg hover:bg-zinc-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={validating}
              className="flex-1 px-4 py-3 bg-[#FFD700] text-zinc-900 font-medium rounded-lg hover:bg-[#FFC700] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {validating ? 'Validando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
