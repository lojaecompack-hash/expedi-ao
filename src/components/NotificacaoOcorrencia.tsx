"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, X, Eye, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"

interface Ocorrencia {
  id: string
  descricao: string
  operadorNome: string | null
  setorOrigem: string | null
  setorDestino: string | null
  createdAt: string
  pedidoNumero: string
  pickupId: string | null
}

export default function NotificacaoOcorrencia() {
  const router = useRouter()
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([])
  const [showPopup, setShowPopup] = useState(false)
  const [ocorrenciaAtual, setOcorrenciaAtual] = useState<Ocorrencia | null>(null)
  const [ultimaVerificacao, setUltimaVerificacao] = useState<string | null>(null)
  const [ocorrenciasVistas, setOcorrenciasVistas] = useState<Set<string>>(new Set())

  // Polling para verificar novas ocorrências a cada 30 segundos
  useEffect(() => {
    const verificarNovasOcorrencias = async () => {
      try {
        let url = '/api/ocorrencias/novas'
        if (ultimaVerificacao) {
          url += `?desde=${encodeURIComponent(ultimaVerificacao)}`
        }

        const res = await fetch(url)
        const data = await res.json()

        if (data.ok && data.ocorrencias.length > 0) {
          // Filtrar ocorrências que ainda não foram vistas
          const novas = data.ocorrencias.filter((o: Ocorrencia) => !ocorrenciasVistas.has(o.id))
          
          if (novas.length > 0) {
            setOcorrencias(novas)
            setOcorrenciaAtual(novas[0])
            setShowPopup(true)
          }
        }

        // Atualizar timestamp da última verificação
        setUltimaVerificacao(new Date().toISOString())
      } catch (error) {
        console.error('Erro ao verificar ocorrências:', error)
      }
    }

    // Verificar imediatamente ao montar
    verificarNovasOcorrencias()

    // Configurar polling a cada 30 segundos
    const interval = setInterval(verificarNovasOcorrencias, 30000)

    return () => clearInterval(interval)
  }, [ultimaVerificacao, ocorrenciasVistas])

  const handleVerDetalhes = () => {
    if (ocorrenciaAtual?.pickupId) {
      // Marcar como vista
      setOcorrenciasVistas(prev => new Set([...prev, ocorrenciaAtual.id]))
      setShowPopup(false)
      router.push(`/admin/retiradas/${ocorrenciaAtual.pickupId}`)
    }
  }

  const handleFechar = () => {
    if (ocorrenciaAtual) {
      // Marcar como vista
      setOcorrenciasVistas(prev => new Set([...prev, ocorrenciaAtual.id]))
    }
    
    // Se houver mais ocorrências, mostrar a próxima
    const restantes = ocorrencias.filter(o => o.id !== ocorrenciaAtual?.id)
    if (restantes.length > 0) {
      setOcorrencias(restantes)
      setOcorrenciaAtual(restantes[0])
    } else {
      setShowPopup(false)
      setOcorrenciaAtual(null)
    }
  }

  return (
    <AnimatePresence>
      {showPopup && ocorrenciaAtual && (
        <motion.div
          initial={{ opacity: 0, y: -50, x: 50 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: -50, x: 50 }}
          className="fixed top-4 right-4 z-[100] max-w-sm w-full"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-amber-200 overflow-hidden">
            {/* Header */}
            <div className="bg-amber-500 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <Bell className="w-5 h-5" />
                <span className="font-semibold">Nova Ocorrência</span>
                {ocorrencias.length > 1 && (
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                    +{ocorrencias.length - 1}
                  </span>
                )}
              </div>
              <button
                onClick={handleFechar}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-500 mb-1">
                    De: <span className="font-medium text-zinc-700">{ocorrenciaAtual.setorOrigem || 'N/A'}</span>
                    {' • '}
                    Pedido: <span className="font-medium text-zinc-700">#{ocorrenciaAtual.pedidoNumero}</span>
                  </p>
                  <p className="text-zinc-900 line-clamp-2">
                    {ocorrenciaAtual.descricao}
                  </p>
                  {ocorrenciaAtual.operadorNome && (
                    <p className="text-xs text-zinc-500 mt-1">
                      por {ocorrenciaAtual.operadorNome}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleFechar}
                  className="flex-1 px-3 py-2 border border-zinc-200 text-zinc-700 rounded-xl hover:bg-zinc-50 text-sm font-medium transition-colors"
                >
                  Fechar
                </button>
                <button
                  onClick={handleVerDetalhes}
                  className="flex-1 px-3 py-2 bg-[#FFD700] text-zinc-900 rounded-xl hover:bg-[#FFC700] text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Ver Detalhes
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
