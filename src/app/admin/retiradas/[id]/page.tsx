"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Package, Truck, User, Calendar, ArrowLeft, Image as ImageIcon, Edit2, Save, X, Loader2, AlertTriangle, CheckCircle, Plus, ChevronDown, ChevronUp, RotateCcw } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"

interface Operador {
  id: string
  name: string
}

interface Ocorrencia {
  id: string
  descricao: string
  operadorNome: string | null
  createdAt: string
}

interface LinhaDoTempo {
  id: string
  numero: number
  status: string
  encerradoEm: string | null
  encerradoPor: string | null
  createdAt: string
  ocorrencias: Ocorrencia[]
}

interface RetiradaHistorico {
  id: string
  cpfLast4: string | null
  operatorId: string | null
  operatorName: string | null
  customerName: string | null
  customerCpfCnpj: string | null
  retrieverName: string | null
  trackingCode: string | null
  previousTrackingCode: string | null
  trackingUpdatedAt: string | null
  transportadora: string | null
  status: string | null
  photo: string | null
  createdAt: string
  numeroRetirada: number
  itens: string | null
  linhasDoTempo: LinhaDoTempo[]
}

interface Retirada {
  id: string
  cpfLast4: string | null
  operatorId: string | null
  operatorName: string | null
  customerName: string | null
  customerCpfCnpj: string | null
  retrieverName: string | null
  trackingCode: string | null
  transportadora: string | null
  status: string | null
  photo: string | null
  createdAt: string
  numeroRetirada: number
  itens: string | null  // JSON dos produtos do pedido
  linhasDoTempo?: LinhaDoTempo[]
  order: {
    id: string
    tinyOrderId: string
    orderNumber: string
    statusTiny: string
    statusInterno: string
    createdAt: string
    updatedAt: string
  }
}

export default function DetalhesRetirada() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  
  const [retirada, setRetirada] = useState<Retirada | null>(null)
  const [historicoRetiradas, setHistoricoRetiradas] = useState<RetiradaHistorico[]>([])
  const [loading, setLoading] = useState(true)
  
  // Estados para edição do rastreio
  const [trackingCode, setTrackingCode] = useState("")
  const [savingTracking, setSavingTracking] = useState(false)
  const [trackingSaved, setTrackingSaved] = useState(false)
  
  // Estados para linhas do tempo de ocorrências
  const [linhasDoTempo, setLinhasDoTempo] = useState<LinhaDoTempo[]>([])
  const [novaOcorrencia, setNovaOcorrencia] = useState("")
  const [criandoLinhaTempo, setCriandoLinhaTempo] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [linhaTempoAtual, setLinhaTempoAtual] = useState<LinhaDoTempo | null>(null)
  const [expandedLinhas, setExpandedLinhas] = useState<Set<string>>(new Set())
  
  // Estados para modal de autenticação do operador
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [operadores, setOperadores] = useState<Operador[]>([])
  const [selectedOperadorId, setSelectedOperadorId] = useState("")
  const [operadorSenha, setOperadorSenha] = useState("")
  const [validandoOperador, setValidandoOperador] = useState(false)
  const [authError, setAuthError] = useState("")
  
  // Estados para seleção em cascata de destino
  const [tiposUsuario] = useState<string[]>(['VENDAS', 'FINANCEIRO', 'EXPEDICAO'])
  const [selectedTipoUsuario, setSelectedTipoUsuario] = useState("")
  const [usuariosPorTipo, setUsuariosPorTipo] = useState<{id: string, name: string, role: string}[]>([])
  const [selectedUsuarioId, setSelectedUsuarioId] = useState("")
  const [operadoresDoUsuario, setOperadoresDoUsuario] = useState<Operador[]>([])
  const [selectedOperadorDestinoId, setSelectedOperadorDestinoId] = useState("") // Operador do usuário de destino (opcional)
  const [selectedSetorDestino, setSelectedSetorDestino] = useState("") // Mantido para compatibilidade
  
  // Estado para foto expandida no histórico
  const [fotoExpandida, setFotoExpandida] = useState<string | null>(null)
  
  // Estados para tipo de ocorrência e motivo de retorno
  const [tipoOcorrencia, setTipoOcorrencia] = useState<'INFORMACAO' | 'RETORNO_PRODUTO'>('INFORMACAO')
  const [motivoRetorno, setMotivoRetorno] = useState('')

  useEffect(() => {
    if (id) {
      fetchRetirada()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Quando seleciona tipo de usuário, buscar usuários daquele tipo
  useEffect(() => {
    if (selectedTipoUsuario) {
      fetchUsuariosPorTipo(selectedTipoUsuario)
      setSelectedUsuarioId("")
      setSelectedOperadorDestinoId("")
      setOperadoresDoUsuario([])
    } else {
      setUsuariosPorTipo([])
      setSelectedUsuarioId("")
      setSelectedOperadorDestinoId("")
      setOperadoresDoUsuario([])
    }
  }, [selectedTipoUsuario])

  // Quando seleciona usuário, buscar operadores dele
  useEffect(() => {
    if (selectedUsuarioId) {
      fetchOperadoresDoUsuario(selectedUsuarioId)
      setSelectedOperadorDestinoId("")
      // Definir o destino como o nome do usuário selecionado
      const usuario = usuariosPorTipo.find(u => u.id === selectedUsuarioId)
      if (usuario) {
        setSelectedSetorDestino(usuario.name)
      }
    } else {
      setOperadoresDoUsuario([])
      setSelectedOperadorDestinoId("")
    }
  }, [selectedUsuarioId, usuariosPorTipo])

  const fetchRetirada = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/retiradas/${id}`)
      const data = await res.json()
      
      if (data.ok) {
        setRetirada(data.retirada)
        // NÃO inicializar trackingCode com valor atual - campo deve começar vazio
        setTrackingCode("")
        // Carregar histórico de retiradas
        if (data.historicoRetiradas) {
          setHistoricoRetiradas(data.historicoRetiradas)
        }
      }
    } catch (error) {
      console.error('Erro ao buscar retirada:', error)
    } finally {
      setLoading(false)
    }
  }

  // Função para salvar rastreio editado
  const saveTrackingCode = async () => {
    if (!retirada) return
    
    setSavingTracking(true)
    setTrackingSaved(false)
    try {
      const res = await fetch(`/api/retiradas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingCode: trackingCode.trim() })
      })
      
      const data = await res.json()
      
      if (data.ok) {
        setRetirada({ ...retirada, trackingCode: trackingCode.trim() })
        setTrackingSaved(true)
        // Limpar campo de input após salvar
        setTrackingCode('')
        // Recarregar dados para atualizar histórico
        fetchRetirada()
        // Esconder mensagem após 3 segundos
        setTimeout(() => setTrackingSaved(false), 3000)
      } else {
        alert('Erro ao salvar rastreio: ' + (data.error || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Erro ao salvar rastreio:', error)
      alert('Erro ao salvar rastreio')
    } finally {
      setSavingTracking(false)
    }
  }

  // Buscar linhas do tempo
  const fetchLinhasDoTempo = async () => {
    try {
      const res = await fetch(`/api/retiradas/${id}/linhas-tempo`)
      const data = await res.json()
      if (data.ok) {
        setLinhasDoTempo(data.linhasDoTempo)
      }
    } catch (error) {
      console.error('Erro ao buscar linhas do tempo:', error)
    }
  }

  // Buscar operadores do usuário logado
  const fetchOperadores = async () => {
    try {
      const res = await fetch('/api/operadores')
      const data = await res.json()
      if (data.ok) {
        setOperadores(data.operadores)
      }
    } catch (error) {
      console.error('Erro ao buscar operadores:', error)
    }
  }

  // Buscar usuários de um tipo específico
  const fetchUsuariosPorTipo = async (tipo: string) => {
    try {
      console.log('[fetchUsuariosPorTipo] Buscando usuários do tipo:', tipo)
      const res = await fetch(`/api/users/by-type?tipo=${encodeURIComponent(tipo)}`)
      const data = await res.json()
      console.log('[fetchUsuariosPorTipo] Resposta da API:', data)
      if (data.ok) {
        console.log('[fetchUsuariosPorTipo] Usuários encontrados:', data.users)
        setUsuariosPorTipo(data.users)
      } else {
        console.error('[fetchUsuariosPorTipo] Erro na API:', data.error)
        setUsuariosPorTipo([])
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
      setUsuariosPorTipo([])
    }
  }

  // Buscar operadores de um usuário específico
  const fetchOperadoresDoUsuario = async (usuarioId: string) => {
    try {
      const res = await fetch(`/api/users/${usuarioId}/operators`)
      const data = await res.json()
      if (data.ok) {
        setOperadoresDoUsuario(data.operators || [])
      }
    } catch (error) {
      console.error('Erro ao buscar operadores do usuário:', error)
      setOperadoresDoUsuario([])
    }
  }

  // Obter linha do tempo aberta (se existir)
  const linhaAberta = linhasDoTempo.find(l => l.status === 'ABERTA')
  
  // Debug: log para verificar estado das linhas
  console.log('[Debug] linhasDoTempo:', linhasDoTempo.length, 'linhaAberta:', linhaAberta ? linhaAberta.id : 'NENHUMA')
  
  // Linhas encerradas
  const linhasEncerradas = linhasDoTempo.filter(l => l.status === 'ENCERRADA')

  // Criar nova linha do tempo
  const criarNovaLinhaTempo = async () => {
    setCriandoLinhaTempo(true)
    try {
      const res = await fetch(`/api/retiradas/${id}/linhas-tempo`, {
        method: 'POST'
      })
      
      const data = await res.json()
      
      if (data.ok) {
        await fetchLinhasDoTempo()
      } else {
        alert('Erro ao criar linha do tempo: ' + (data.error || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Erro ao criar linha do tempo:', error)
      alert('Erro ao criar linha do tempo')
    } finally {
      setCriandoLinhaTempo(false)
    }
  }

  // Abrir modal de autenticação do operador
  const handleAdicionarClick = () => {
    fetchOperadores()
    setShowAuthModal(true)
  }

  // Validar operador e adicionar ocorrência
  const validarEAdicionarOcorrencia = async () => {
    if (tipoOcorrencia === 'RETORNO_PRODUTO' && !motivoRetorno) {
      setAuthError("Selecione o motivo do retorno")
      return
    }
    if (!selectedTipoUsuario || !selectedUsuarioId) {
      setAuthError("Selecione o tipo de usuário e o usuário de destino")
      return
    }
    if (!selectedOperadorId || !operadorSenha) {
      setAuthError("Selecione o operador e digite a senha")
      return
    }

    setValidandoOperador(true)
    setAuthError("")

    try {
      // Validar senha do operador
      const validarRes = await fetch('/api/operadores/validar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          operadorId: selectedOperadorId, 
          senha: operadorSenha 
        })
      })

      const validarData = await validarRes.json()

      if (!validarData.ok) {
        setAuthError(validarData.error || 'Erro ao validar operador')
        setValidandoOperador(false)
        return
      }

      // Operador validado - verificar se precisa criar linha do tempo primeiro
      let linhaId = linhaAberta?.id
      
      if (!linhaId) {
        // Criar nova linha do tempo primeiro
        const criarLinhaRes = await fetch(`/api/retiradas/${id}/linhas-tempo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            tipoOcorrencia,
            motivoRetorno: tipoOcorrencia === 'RETORNO_PRODUTO' ? motivoRetorno : null
          })
        })
        
        const criarLinhaData = await criarLinhaRes.json()
        
        if (!criarLinhaData.ok) {
          setAuthError('Erro ao criar linha do tempo: ' + (criarLinhaData.error || 'Erro desconhecido'))
          setValidandoOperador(false)
          return
        }
        
        linhaId = criarLinhaData.linhaTempo.id
        console.log('[validarEAdicionarOcorrencia] Linha do tempo criada:', linhaId)
      }
      
      // Adicionar ocorrência com setor
      const res = await fetch(`/api/retiradas/${id}/linhas-tempo/${linhaId}/ocorrencias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          descricao: novaOcorrencia.trim(),
          operadorNome: validarData.operador.name,
          setorOrigem: retirada?.operatorName || 'Expedição', // Setor de origem é o operador da retirada
          setorDestino: selectedSetorDestino,
          tipoOcorrencia,
          motivoRetorno: tipoOcorrencia === 'RETORNO_PRODUTO' ? motivoRetorno : null
        })
      })
      
      const data = await res.json()
      
      if (data.ok) {
        setNovaOcorrencia("")
        setShowAuthModal(false)
        setLinhaTempoAtual(linhaAberta || null)
        setShowModal(true)
        fetchLinhasDoTempo()
      } else {
        setAuthError('Erro ao adicionar ocorrência: ' + (data.error || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Erro ao adicionar ocorrência:', error)
      setAuthError('Erro ao adicionar ocorrência')
    } finally {
      setValidandoOperador(false)
    }
  }

  // Encerrar linha do tempo
  const encerrarLinhaTempo = async (linhaTempoId: string) => {
    try {
      const res = await fetch(`/api/retiradas/${id}/linhas-tempo/${linhaTempoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'ENCERRADA',
          encerradoPor: retirada?.operatorName || null
        })
      })
      
      const data = await res.json()
      
      if (data.ok) {
        fetchLinhasDoTempo()
        setShowModal(false)
        setLinhaTempoAtual(null)
      } else {
        alert('Erro ao encerrar linha do tempo: ' + (data.error || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Erro ao encerrar linha do tempo:', error)
      alert('Erro ao encerrar linha do tempo')
    }
  }

  // Toggle expandir/colapsar linha encerrada
  const toggleExpandLinha = (linhaId: string) => {
    setExpandedLinhas(prev => {
      const newSet = new Set(prev)
      if (newSet.has(linhaId)) {
        newSet.delete(linhaId)
      } else {
        newSet.add(linhaId)
      }
      return newSet
    })
  }

  // Buscar linhas do tempo quando carregar a página
  useEffect(() => {
    if (id) {
      fetchLinhasDoTempo()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-zinc-600 mt-4">Carregando detalhes...</p>
        </div>
      </div>
    )
  }

  if (!retirada) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
          <p className="text-zinc-600">Retirada não encontrada</p>
          <Link href="/admin/relatorios/retiradas" className="text-[#FFD700] hover:underline mt-4 inline-block">
            Voltar para relatórios
          </Link>
        </div>
      </div>
    )
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
            <Truck className="w-5 h-5" />
            <span className="font-medium">Retirada</span>
          </Link>
          <Link href="/admin/relatorios/retiradas" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#FFD700] text-zinc-900">
            <Package className="w-5 h-5" />
            <span className="font-medium">Relatórios</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="ml-64 p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link href="/admin/relatorios/retiradas" className="p-2 hover:bg-zinc-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-zinc-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-zinc-900">Detalhes da Retirada</h1>
              <p className="text-zinc-600 mt-1">Informações completas do pedido #{retirada.order.orderNumber}</p>
            </div>
          </div>

          {/* Dados do Pedido */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-zinc-200 p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#FFD700]/20 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-[#FFD700]" />
              </div>
              <h2 className="text-xl font-bold text-zinc-900">Dados do Pedido</h2>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-zinc-600 mb-1">Número do Pedido</p>
                <p className="text-lg font-semibold text-zinc-900">#{retirada.order.orderNumber}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-600 mb-1">ID Tiny</p>
                <p className="text-lg font-semibold text-zinc-900">{retirada.order.tinyOrderId}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-600 mb-1">Status Tiny</p>
                <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                  {retirada.order.statusTiny}
                </span>
              </div>
              <div>
                <p className="text-sm text-zinc-600 mb-1">Status Interno</p>
                <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                  {retirada.order.statusInterno}
                </span>
              </div>
              <div>
                <p className="text-sm text-zinc-600 mb-1">Criado em</p>
                <div className="flex items-center gap-2 text-zinc-900">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(retirada.order.createdAt).toLocaleString('pt-BR')}</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-zinc-600 mb-1">Atualizado em</p>
                <div className="flex items-center gap-2 text-zinc-900">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(retirada.order.updatedAt).toLocaleString('pt-BR')}</span>
                </div>
              </div>
            </div>

            {/* Produtos do Pedido */}
            {retirada.itens && (() => {
              try {
                const produtos = JSON.parse(retirada.itens) as Array<{id: string, descricao: string, quantidade: number}>
                if (produtos.length > 0) {
                  return (
                    <div className="mt-6 pt-6 border-t border-zinc-200">
                      <p className="text-sm font-medium text-zinc-700 mb-3">📦 Produtos do Pedido</p>
                      <div className="space-y-2">
                        {produtos.map((produto, index) => (
                          <div 
                            key={produto.id || index}
                            className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg border border-zinc-200"
                          >
                            <Package className="w-4 h-4 text-zinc-400 shrink-0" />
                            <div className="flex-1">
                              <span className="text-sm font-medium text-zinc-900">{produto.descricao}</span>
                            </div>
                            <span className="text-sm text-zinc-600 font-medium">Qtd: {produto.quantidade}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                }
              } catch (e) {
                console.error('Erro ao parsear itens:', e)
              }
              return null
            })()}
          </motion.div>

          {/* Histórico de Retiradas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-zinc-200 p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <RotateCcw className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-zinc-900">Histórico de Retiradas ({historicoRetiradas.length})</h2>
              </div>
              
              {/* Botão Nova Retirada se a última estiver retornada */}
              {historicoRetiradas.length > 0 && historicoRetiradas[0].status === 'RETORNADO' && (
                <button
                  onClick={() => router.push(`/expedicao/retirada?pedido=${retirada.order.orderNumber}&retiradaAnteriorId=${historicoRetiradas[0].id}`)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <RotateCcw className="w-4 h-4" />
                  Nova Retirada
                </button>
              )}
            </div>

            {/* Timeline de Retiradas */}
            <div className="space-y-4">
              {historicoRetiradas.map((ret, index) => {
                const isAtual = ret.id === retirada.id
                const getBadge = () => {
                  if (ret.status === 'RETORNADO') {
                    return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium">📦 Retornado</span>
                  } else if (ret.status === 'AGUARDANDO_RETIRADA') {
                    return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium">⏳ Aguardando</span>
                  } else if (ret.numeroRetirada > 1) {
                    return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">🔄 Re-Retirado</span>
                  } else {
                    return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium">✓ Retirado</span>
                  }
                }

                return (
                  <div key={ret.id} className="relative">
                    {/* Linha conectora */}
                    {index < historicoRetiradas.length - 1 && (
                      <div className="absolute left-6 top-full w-0.5 h-4 bg-zinc-300" />
                    )}
                    
                    <div className={`border rounded-xl p-5 ${isAtual ? 'border-blue-300 bg-blue-50/30' : 'border-zinc-200 bg-white'}`}>
                      {/* Header do card */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            ret.status === 'RETORNADO' ? 'bg-amber-100 text-amber-700' :
                            ret.numeroRetirada > 1 ? 'bg-blue-100 text-blue-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            #{ret.numeroRetirada}
                          </div>
                          <div>
                            <span className="font-semibold text-zinc-900">Retirada #{ret.numeroRetirada}</span>
                            {isAtual && <span className="ml-2 text-xs text-blue-600">(atual)</span>}
                          </div>
                        </div>
                        {getBadge()}
                      </div>

                      {/* Dados da retirada */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-zinc-500">Retirante</p>
                          <p className="font-medium flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {ret.retrieverName || 'N/A'}
                          </p>
                          {ret.customerCpfCnpj && (
                            <p className="text-xs text-zinc-400 mt-0.5">CPF: {ret.customerCpfCnpj}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-zinc-500">Operador</p>
                          <p className="font-medium">{ret.operatorName || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-zinc-500">Transportadora</p>
                          <p className="font-medium flex items-center gap-1">
                            <Truck className="w-3 h-3" />
                            {ret.transportadora || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-zinc-500">Data</p>
                          <p className="font-medium flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(ret.createdAt).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        {/* Rastreio - Seção completa */}
                        <div className="col-span-2">
                          <p className="text-zinc-500 mb-1">Rastreio</p>
                          {/* Mostrar rastreio atual e anterior */}
                          {ret.trackingCode && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-green-600 font-medium">Atual:</span>
                              {ret.trackingCode.startsWith('http') ? (
                                <a href={ret.trackingCode} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                                  {ret.trackingCode} ↗
                                </a>
                              ) : (
                                <span className="font-medium">{ret.trackingCode}</span>
                              )}
                            </div>
                          )}
                          {ret.previousTrackingCode && (
                            <div className="flex items-center gap-2 mt-1 text-sm text-zinc-500">
                              <span className="text-xs">Anterior:</span>
                              <span className="line-through">{ret.previousTrackingCode}</span>
                              {ret.trackingUpdatedAt && (
                                <span className="text-xs">(substituído em {new Date(ret.trackingUpdatedAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })})</span>
                              )}
                            </div>
                          )}
                          {!ret.trackingCode && !ret.previousTrackingCode && (
                            <p className="text-zinc-400 italic text-sm">Sem rastreio</p>
                          )}
                          
                          {/* Campo editável - apenas para retirada atual com status AGUARDANDO_RETIRADA */}
                          {isAtual && ret.status === 'AGUARDANDO_RETIRADA' && (
                            <div className="mt-3 pt-3 border-t border-zinc-200">
                              <p className="text-xs text-zinc-500 mb-2">📦 Atualizar rastreio:</p>
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={trackingCode}
                                  onChange={(e) => setTrackingCode(e.target.value)}
                                  placeholder="Digite o código ou URL..."
                                  className="flex-1 px-3 py-1.5 text-sm border border-zinc-300 rounded-lg focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
                                />
                                <button
                                  onClick={saveTrackingCode}
                                  disabled={savingTracking || trackingCode === (ret.trackingCode || '')}
                                  className="px-3 py-1.5 text-sm bg-[#FFD700] text-zinc-900 rounded-lg hover:bg-[#FFC700] font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                >
                                  {savingTracking ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Save className="w-3 h-3" />
                                  )}
                                  Atualizar
                                </button>
                              </div>
                              {trackingSaved && (
                                <p className="text-green-600 text-xs font-medium mt-1">✅ Rastreio atualizado!</p>
                              )}
                            </div>
                          )}
                        </div>
                        {ret.photo && (
                          <div className="relative">
                            <p className="text-zinc-500">Foto</p>
                            <button
                              onClick={() => setFotoExpandida(fotoExpandida === ret.id ? null : ret.id)}
                              className="text-blue-600 hover:underline font-medium flex items-center gap-1"
                            >
                              <ImageIcon className="w-3 h-3" />
                              {fotoExpandida === ret.id ? 'Fechar' : 'Ver foto'}
                            </button>
                            {/* Popover da foto */}
                            {fotoExpandida === ret.id && (
                              <div className="absolute z-50 mt-2 p-2 bg-white border border-zinc-200 rounded-xl shadow-xl">
                                <img 
                                  src={ret.photo} 
                                  alt="Foto da retirada"
                                  className="w-auto h-auto max-w-2xl max-h-[600px] rounded-lg object-contain"
                                />
                                <button
                                  onClick={() => window.open(ret.photo!, '_blank')}
                                  className="mt-2 text-xs text-blue-600 hover:underline w-full text-center"
                                >
                                  Abrir em tela cheia ↗
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Ocorrências desta retirada */}
                      {ret.linhasDoTempo && ret.linhasDoTempo.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-zinc-200">
                          <p className="text-sm font-medium text-zinc-700 mb-2">
                            📋 Ocorrências ({ret.linhasDoTempo.reduce((acc, l) => acc + l.ocorrencias.length, 0)})
                          </p>
                          <div className="space-y-2">
                            {ret.linhasDoTempo.map((linha) => (
                              <div key={linha.id} className={`p-3 rounded-lg text-sm ${
                                linha.status === 'ABERTA' ? 'bg-red-50 border border-red-200' : 'bg-zinc-50'
                              }`}>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                    linha.status === 'ABERTA' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                  }`}>
                                    Linha #{linha.numero} - {linha.status}
                                  </span>
                                  {linha.encerradoEm && (
                                    <span className="text-xs text-zinc-500">
                                      Encerrada em {new Date(linha.encerradoEm).toLocaleString('pt-BR')}
                                    </span>
                                  )}
                                </div>
                                {linha.ocorrencias.map((oc) => (
                                  <div key={oc.id} className="pl-3 border-l-2 border-zinc-300 py-1">
                                    <p className="text-zinc-700">{oc.descricao}</p>
                                    <p className="text-xs text-zinc-500">
                                      {new Date(oc.createdAt).toLocaleString('pt-BR')} 
                                      {oc.operadorNome && ` - ${oc.operadorNome}`}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Botão para Registrar Nova Ocorrência */}
            <div className="mt-6 flex justify-center">
              {linhaAberta ? (
                <button
                  onClick={handleAdicionarClick}
                  className="px-6 py-3 bg-[#FFD700] text-zinc-900 rounded-xl hover:bg-[#FFC700] font-medium flex items-center gap-2 shadow-md"
                >
                  <Plus className="w-5 h-5" />
                  Adicionar Ocorrência
                </button>
              ) : (
                <button
                  onClick={handleAdicionarClick}
                  className="px-6 py-3 bg-[#FFD700] text-zinc-900 rounded-xl hover:bg-[#FFC700] font-medium flex items-center gap-2 shadow-md"
                >
                  <Plus className="w-5 h-5" />
                  Registrar Primeira Ocorrência
                </button>
              )}
            </div>
          </motion.div>

          {/* Modal de Autenticação do Operador */}
          {showAuthModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-xl"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                    <User className="w-6 h-6 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900">Identificação do Operador</h3>
                </div>
                
                <div className="space-y-4 mb-6">
                  {/* Tipo de Ocorrência - só aparece se não houver linha aberta */}
                  {!linhaAberta && (
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">
                        Tipo de Ocorrência <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={tipoOcorrencia}
                        onChange={(e) => setTipoOcorrencia(e.target.value as 'INFORMACAO' | 'RETORNO_PRODUTO')}
                        className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-[#FFD700] focus:border-transparent bg-white"
                      >
                        <option value="INFORMACAO">📝 Informação / Outros</option>
                        <option value="RETORNO_PRODUTO">📦 Retorno de Produto</option>
                      </select>
                    </div>
                  )}

                  {/* Motivo do Retorno (aparece apenas se tipo = RETORNO_PRODUTO e não há linha aberta) */}
                  {!linhaAberta && tipoOcorrencia === 'RETORNO_PRODUTO' && (
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">
                        Motivo do Retorno <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={motivoRetorno}
                        onChange={(e) => setMotivoRetorno(e.target.value)}
                        className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-[#FFD700] focus:border-transparent bg-white"
                      >
                        <option value="">Selecione o motivo...</option>
                        <option value="DESTINATARIO_AUSENTE">Destinatário ausente</option>
                        <option value="ENDERECO_INCORRETO">Endereço incorreto</option>
                        <option value="RECUSA_CLIENTE">Recusa do cliente</option>
                        <option value="AVARIADO">Avariado no transporte</option>
                        <option value="EXTRAVIO">Extravio</option>
                        <option value="OUTRO">Outro</option>
                      </select>
                    </div>
                  )}

                  {/* Seleção em cascata: Tipo -> Usuário -> Operador */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">
                      Tipo de Usuário <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedTipoUsuario}
                      onChange={(e) => setSelectedTipoUsuario(e.target.value)}
                      className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-[#FFD700] focus:border-transparent bg-white"
                    >
                      <option value="">Selecione o tipo...</option>
                      {tiposUsuario.map((tipo) => (
                        <option key={tipo} value={tipo}>{tipo}</option>
                      ))}
                    </select>
                  </div>

                  {selectedTipoUsuario && (
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">
                        Usuário <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={selectedUsuarioId}
                        onChange={(e) => setSelectedUsuarioId(e.target.value)}
                        className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-[#FFD700] focus:border-transparent bg-white"
                      >
                        <option value="">Selecione o usuário...</option>
                        {usuariosPorTipo.map((usuario) => (
                          <option key={usuario.id} value={usuario.id}>{usuario.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {selectedUsuarioId && operadoresDoUsuario.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">
                        Operador de Destino (opcional)
                      </label>
                      <select
                        value={selectedOperadorDestinoId}
                        onChange={(e) => setSelectedOperadorDestinoId(e.target.value)}
                        className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-[#FFD700] focus:border-transparent bg-white"
                      >
                        <option value="">Nenhum operador específico</option>
                        {operadoresDoUsuario.map((op) => (
                          <option key={op.id} value={op.id}>{op.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Operador Responsável <span className="text-red-500">*</span></label>
                    <select
                      value={selectedOperadorId}
                      onChange={(e) => setSelectedOperadorId(e.target.value)}
                      className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-[#FFD700] focus:border-transparent bg-white"
                    >
                      <option value="">Selecione o operador...</option>
                      {operadores.map((op) => (
                        <option key={op.id} value={op.id}>{op.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Senha</label>
                    <input
                      type="password"
                      value={operadorSenha}
                      onChange={(e) => setOperadorSenha(e.target.value)}
                      placeholder="Digite sua senha..."
                      className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">
                      Descrição da Ocorrência <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={novaOcorrencia}
                      onChange={(e) => setNovaOcorrencia(e.target.value)}
                      placeholder="Descreva a ocorrência..."
                      rows={3}
                      className="w-full px-4 py-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-[#FFD700] focus:border-transparent resize-none"
                      onKeyDown={(e) => e.key === 'Enter' && e.ctrlKey && validarEAdicionarOcorrencia()}
                    />
                    <p className="text-xs text-zinc-500 mt-1">Pressione Ctrl+Enter para enviar</p>
                  </div>

                  {authError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                      <p className="text-sm text-red-600">{authError}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowAuthModal(false)
                      setAuthError("")
                    }}
                    disabled={validandoOperador}
                    className="flex-1 px-4 py-3 border border-zinc-200 text-zinc-700 rounded-xl hover:bg-zinc-50 font-medium disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={validarEAdicionarOcorrencia}
                    disabled={validandoOperador || !selectedOperadorId || !operadorSenha || !novaOcorrencia.trim()}
                    className="flex-1 px-4 py-3 bg-[#FFD700] text-zinc-900 rounded-xl hover:bg-[#FFC700] font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {validandoOperador ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                    {validandoOperador ? 'Validando...' : 'Registrar'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Modal após adicionar ocorrência - pergunta se quer encerrar */}
          {showModal && linhaTempoAtual && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-xl"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900">Ocorrência Adicionada</h3>
                </div>
                
                <p className="text-zinc-600 mb-6">
                  Deseja encerrar esta linha do tempo agora?
                </p>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowModal(false)
                      setLinhaTempoAtual(null)
                    }}
                    className="flex-1 px-4 py-3 border border-zinc-200 text-zinc-700 rounded-xl hover:bg-zinc-50 font-medium"
                  >
                    Manter Aberta
                  </button>
                  <button
                    onClick={() => encerrarLinhaTempo(linhaTempoAtual.id)}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Encerrar Linha
                  </button>
                </div>
              </motion.div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
