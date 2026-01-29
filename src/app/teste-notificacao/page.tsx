"use client"

import { useState, useEffect, useRef } from "react"

interface Ocorrencia {
  id: string
  descricao: string
  remetenteId: string | null
  destinatarioId: string | null
  setorOrigem: string | null
  setorDestino: string | null
  createdAt: string
}

// Simular IDs vistos
const idsVistosTeste = new Set<string>()

export default function TesteNotificacao() {
  const [status, setStatus] = useState<string>("Iniciando...")
  const [apiResponse, setApiResponse] = useState<string>("")
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([])
  const [showPopup, setShowPopup] = useState(false)
  const isShowingRef = useRef(false)

  const handleFechar = () => {
    if (ocorrencias.length > 0) {
      idsVistosTeste.add(ocorrencias[0].id)
    }
    const restantes = ocorrencias.slice(1)
    if (restantes.length > 0) {
      setOcorrencias(restantes)
    } else {
      isShowingRef.current = false
      setShowPopup(false)
    }
  }

  useEffect(() => {
    let isMounted = true
    
    const buscarNotificacoes = async () => {
      if (isShowingRef.current) {
        return
      }
      
      setStatus("🔄 Buscando notificações...")
      
      try {
        const res = await fetch('/api/debug-notificacoes-test?email=rodrigo@ecompack.com.br')
        
        if (!res.ok) {
          setStatus(`❌ HTTP ${res.status}`)
          return
        }
        
        const data = await res.json()
        setApiResponse(JSON.stringify(data, null, 2))
        
        if (!isMounted) return
        
        if (data.ok && data.ocorrenciasAposFiltro && Array.isArray(data.ocorrenciasAposFiltro)) {
          const novas = data.ocorrenciasAposFiltro.filter((o: Ocorrencia) => !idsVistosTeste.has(o.id))
          
          setStatus(`✅ ${data.ocorrenciasAposFiltro.length} total, ${novas.length} novas`)
          
          if (novas.length > 0) {
            isShowingRef.current = true
            setOcorrencias(novas)
            setShowPopup(true)
            setStatus(`🔔 POPUP DEVE APARECER! (${novas.length} notificações)`)
          }
        } else {
          setStatus(`❌ API retornou: ${data.error || 'sem dados'}`)
        }
      } catch (err) {
        setStatus(`❌ Erro: ${err}`)
      }
    }

    buscarNotificacoes()
    const timer = setInterval(buscarNotificacoes, 5000)

    return () => {
      isMounted = false
      clearInterval(timer)
    }
  }, [])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🧪 Teste de Notificações (Rodrigo)</h1>
      
      <div className={`mb-4 p-4 rounded ${showPopup ? 'bg-green-100 border-2 border-green-500' : 'bg-gray-100'}`}>
        <strong>Status:</strong> {status}
        <br />
        <strong>showPopup:</strong> {showPopup ? '✅ TRUE' : '❌ FALSE'}
      </div>

      {showPopup && ocorrencias.length > 0 && (
        <div className="mb-4 p-4 bg-amber-500 text-white rounded-xl shadow-lg">
          <h3 className="font-bold text-lg mb-2">🔔 NOTIFICAÇÃO APARECEU!</h3>
          <p><strong>De:</strong> {ocorrencias[0].setorOrigem || 'Sistema'}</p>
          <p><strong>Mensagem:</strong> {ocorrencias[0].descricao}</p>
          <button 
            onClick={handleFechar}
            className="mt-2 px-4 py-2 bg-white text-amber-600 rounded font-bold"
          >
            Fechar ({ocorrencias.length} restantes)
          </button>
        </div>
      )}

      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Ocorrências ({ocorrencias.length}):</h2>
        {ocorrencias.length > 0 ? (
          <div className="space-y-2">
            {ocorrencias.map(o => (
              <div key={o.id} className="p-3 bg-amber-50 border border-amber-200 rounded text-sm">
                <div><strong>ID:</strong> {o.id}</div>
                <div><strong>Descrição:</strong> {o.descricao.substring(0, 50)}...</div>
                <div><strong>De:</strong> {o.setorOrigem || 'N/A'}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Nenhuma ocorrência carregada</p>
        )}
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Resposta da API:</h2>
        <pre className="p-4 bg-gray-900 text-green-400 rounded overflow-auto text-xs max-h-64">
          {apiResponse || "Aguardando..."}
        </pre>
      </div>
    </div>
  )
}
