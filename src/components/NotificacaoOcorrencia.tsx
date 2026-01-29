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

// IDs já vistos (persistente durante a sessão)
const idsVistos = new Set<string>()

export default function NotificacaoOcorrencia() {
  const router = useRouter()
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([])
  const [showPopup, setShowPopup] = useState(false)
  const [ocorrenciaAtual, setOcorrenciaAtual] = useState<Ocorrencia | null>(null)

  // Polling simples - roda apenas uma vez ao montar e depois a cada 10s
  useEffect(() => {
    let isMounted = true
    
    const buscarNotificacoes = async () => {
      try {
        const res = await fetch('/api/ocorrencias/novas')
        if (!res.ok) return
        
        const data = await res.json()
        
        if (!isMounted) return
        
        if (data.ok && data.ocorrencias && Array.isArray(data.ocorrencias)) {
          // Filtrar apenas as que ainda não foram vistas
          const novas = data.ocorrencias.filter((o: Ocorrencia) => !idsVistos.has(o.id))
          
          if (novas.length > 0 && !showPopup) {
            setOcorrencias(novas)
            setOcorrenciaAtual(novas[0])
            setShowPopup(true)
          }
        }
      } catch {
        // Silencioso - não quebrar a UI
      }
    }

    // Buscar imediatamente
    buscarNotificacoes()

    // Polling a cada 10 segundos
    const timer = setInterval(buscarNotificacoes, 10000)

    return () => {
      isMounted = false
      clearInterval(timer)
    }
  }, []) // Sem dependências - roda apenas ao montar

  const handleVerDetalhes = () => {
    if (ocorrenciaAtual) {
      idsVistos.add(ocorrenciaAtual.id)
      setShowPopup(false)
      if (ocorrenciaAtual.pickupId) {
        router.push(`/admin/retiradas/${ocorrenciaAtual.pickupId}`)
      }
    }
  }

  const handleFechar = () => {
    if (ocorrenciaAtual) {
      idsVistos.add(ocorrenciaAtual.id)
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
