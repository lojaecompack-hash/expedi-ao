"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { CheckCircle, AlertCircle, User, Settings, Package, Truck, Camera, X, RotateCcw } from "lucide-react"
import MainLayout from "@/components/MainLayout"
import PasswordValidationModal from "@/components/PasswordValidationModal"
import { Html5Qrcode } from "html5-qrcode"
import { useSearchParams } from "next/navigation"

interface OrderDetails {
  id: string
  numero: string
  situacao: string
  clienteNome: string
  transportadora: string
  itens: Array<{
    id: string
    descricao: string
    quantidade: number
  }>
}

// Status bloqueados para retirada
const BLOCKED_STATUS = ['aberto', 'em aberto', 'enviado', 'entregue', 'cancelado', 'aprovado', 'preparando envio', 'faturado']

// Mensagens de bloqueio por status
const BLOCKED_STATUS_MESSAGES: Record<string, string> = {
  'aberto': 'Este pedido ainda está em aberto e não pode ser retirado.',
  'em aberto': 'Este pedido ainda está em aberto e não pode ser retirado.',
  'enviado': 'Este pedido já foi enviado anteriormente.',
  'entregue': 'Este pedido já foi entregue ao cliente.',
  'cancelado': 'Este pedido foi cancelado e não pode ser processado.',
  'aprovado': 'Pedido não embalado',
  'preparando envio': 'Pedido não embalado',
  'faturado': 'Pedido não embalado',
}

interface Operator {
  id: string
  name: string
  isActive: boolean
}

export default function RetiradaPage() {
  const searchParams = useSearchParams()
  
  const [orderNumber, setOrderNumber] = useState("")
  const [cpf, setCpf] = useState("")
  const [operatorId, setOperatorId] = useState("")
  const [retrieverName, setRetrieverName] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>("")
  
  // Estado para re-retirada
  const [retiradaAnteriorId, setRetiradaAnteriorId] = useState<string | null>(null)
  const [isReRetirada, setIsReRetirada] = useState(false)
  const [success, setSuccess] = useState(false)
  
  // Estados para busca automática
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null)
  const [loadingOrder, setLoadingOrder] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  
  // Estados para conferência
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})
  
  // Estados para foto
  const [photo, setPhoto] = useState<string | null>(null)
  const [showCamera, setShowCamera] = useState(false)
  
  // Estados para operadores
  const [operators, setOperators] = useState<Operator[]>([])
  
  // Estados para validação de senha
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [pendingSubmit, setPendingSubmit] = useState(false)
  
  // Estados para scanner de código de barras
  const [showScanner, setShowScanner] = useState(false)
  const [scannerError, setScannerError] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  
  // Estados para rastreio
  const [trackingCode, setTrackingCode] = useState("")
  const [savedTrackingCode, setSavedTrackingCode] = useState<string | null>(null)
  const [loadingTracking, setLoadingTracking] = useState(false)
  
  // Estados para transportadora
  const [transportadoraSelecionada, setTransportadoraSelecionada] = useState<string>("")
  
  // Estados para modal de bloqueio por status
  const [showBlockedModal, setShowBlockedModal] = useState(false)
  const [blockedStatus, setBlockedStatus] = useState<string>("")
  const [blockedMessage, setBlockedMessage] = useState<string>("")
  
  useEffect(() => {
    fetchOperators()
    
    // Verificar se veio de uma re-retirada
    const pedidoParam = searchParams.get('pedido')
    const retiradaAnteriorParam = searchParams.get('retiradaAnteriorId')
    
    if (pedidoParam) {
      setOrderNumber(pedidoParam)
      setIsReRetirada(true)
      if (retiradaAnteriorParam) {
        setRetiradaAnteriorId(retiradaAnteriorParam)
      }
      // Buscar detalhes do pedido automaticamente
      searchOrder(pedidoParam)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  const fetchOperators = async () => {
    try {
      const res = await fetch('/api/operators')
      const data = await res.json()
      
      if (data.ok) {
        setOperators(data.operators.filter((op: Operator) => op.isActive))
      }
    } catch (error) {
      console.error('Erro ao buscar operadores:', error)
    }
  }

  // Função para buscar detalhes do pedido via API
  const searchOrder = async (number: string) => {
    console.log('[Client] Iniciando busca para pedido:', number)
    
    if (!number || number.trim().length === 0) {
      console.log('[Client] Número vazio, limpando detalhes')
      setOrderDetails(null)
      return
    }

    setLoadingOrder(true)
    try {
      const url = `/api/order-details?number=${encodeURIComponent(number)}`
      console.log('[Client] Chamando API:', url)
      
      const res = await fetch(url)
      console.log('[Client] Resposta recebida, status:', res.status)
      
      if (!res.ok) {
        console.error('[Client] Erro HTTP:', res.status)
        setOrderDetails(null)
        return
      }
      
      const details = await res.json()
      console.log('[Client] Dados recebidos:', details)
      
      if (details.error) {
        console.error('[Client] Erro na resposta:', details.error)
        setOrderDetails(null)
        return
      }
      
      console.log('[Client] Definindo orderDetails:', details)
      console.log('[Client] Status do pedido:', details.situacao)
      
      // Verificar se o status está bloqueado
      const statusLower = (details.situacao || '').toLowerCase()
      const isBlocked = BLOCKED_STATUS.some(blocked => statusLower.includes(blocked))
      
      if (isBlocked) {
        console.log('[Client] Pedido bloqueado por status:', statusLower)
        const message = BLOCKED_STATUS_MESSAGES[statusLower] || 
          `Este pedido está com status "${details.situacao}" e não pode ser processado para retirada.`
        setBlockedStatus(details.situacao)
        setBlockedMessage(message)
        setShowBlockedModal(true)
        setOrderDetails(null)
        return
      }
      
      setOrderDetails(details)
      
      // Inicializar checkboxes desmarcados
      const initialChecks: Record<string, boolean> = {}
      details.itens.forEach((item: { id: string }) => {
        initialChecks[item.id] = false
      })
      setCheckedItems(initialChecks)
      
      // Pré-preencher transportadora com valor da Tiny se existir
      if (details.transportadora && details.transportadora !== 'Não definida') {
        setTransportadoraSelecionada(details.transportadora)
      } else {
        setTransportadoraSelecionada("")
      }
      
      // Buscar rastreio existente para este pedido
      try {
        const trackingRes = await fetch(`/api/pickups/tracking?orderNumber=${encodeURIComponent(number)}`)
        const trackingData = await trackingRes.json()
        if (trackingData.ok && trackingData.trackingCode) {
          console.log('[Client] Rastreio encontrado:', trackingData.trackingCode)
          setTrackingCode(trackingData.trackingCode)
          setSavedTrackingCode(trackingData.trackingCode)
        } else {
          setTrackingCode("")
          setSavedTrackingCode(null)
        }
      } catch (trackingError) {
        console.error('[Client] Erro ao buscar rastreio:', trackingError)
        setTrackingCode("")
        setSavedTrackingCode(null)
      }
    } catch (error) {
      console.error('[Client] Erro ao buscar pedido:', error)
      setOrderDetails(null)
      setCheckedItems({})
      setTrackingCode("")
      setSavedTrackingCode(null)
    } finally {
      setLoadingOrder(false)
      console.log('[Client] Busca finalizada')
    }
  }

  // Handler para mudança no número do pedido com debounce
  const handleOrderNumberChange = (value: string) => {
    setOrderNumber(value)
    
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    
    const timeout = setTimeout(() => {
      searchOrder(value)
    }, 500)
    
    setSearchTimeout(timeout)
  }
  
  // Iniciar scanner de código de barras
  const startScanner = async () => {
    setScannerError(null)
    setShowScanner(true)
    
    // Aguardar o elemento ser renderizado
    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode("barcode-reader")
        scannerRef.current = scanner
        
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
          },
          (decodedText) => {
            // Código lido com sucesso - carregar dados IMEDIATAMENTE
            console.log("Código lido:", decodedText)
            setOrderNumber(decodedText)
            searchOrder(decodedText)
            stopScanner()
          },
          () => {
            // Erro de leitura (normal durante scan)
          }
        )
      } catch (err) {
        console.error("Erro ao iniciar scanner:", err)
        setScannerError("Erro ao acessar câmera. Verifique as permissões.")
      }
    }, 100)
  }
  
  // Parar scanner
  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current.clear()
      } catch (err) {
        console.error("Erro ao parar scanner:", err)
      }
    }
    setShowScanner(false)
    setScannerError(null)
    scannerRef.current = null
  }
  
  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
      }
    }
  }, [])

  // Toggle checkbox individual
  const toggleItem = (itemId: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }))
  }

  // Toggle todos os checkboxes
  const toggleAll = () => {
    if (!orderDetails) return
    
    const allChecked = Object.values(checkedItems).every(Boolean)
    const newChecks: Record<string, boolean> = {}
    
    orderDetails.itens.forEach(item => {
      newChecks[item.id] = !allChecked
    })
    
    setCheckedItems(newChecks)
  }

  // Comprimir imagem usando Canvas
  const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.6): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height
          
          // Redimensionar se for maior que maxWidth
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
          
          canvas.width = width
          canvas.height = height
          
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Erro ao criar contexto canvas'))
            return
          }
          
          ctx.drawImage(img, 0, 0, width, height)
          
          // Converter para JPEG com qualidade reduzida
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
          console.log('[Foto] Original:', Math.round(file.size / 1024), 'KB')
          console.log('[Foto] Comprimido:', Math.round(compressedDataUrl.length / 1024), 'KB')
          resolve(compressedDataUrl)
        }
        img.onerror = () => reject(new Error('Erro ao carregar imagem'))
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'))
      reader.readAsDataURL(file)
    })
  }

  // Capturar foto via input file (com compressão)
  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      // Comprimir imagem para max 800px largura e 60% qualidade
      const compressedPhoto = await compressImage(file, 800, 0.6)
      setPhoto(compressedPhoto)
    } catch (error) {
      console.error('[Foto] Erro ao comprimir:', error)
      // Fallback para método original se compressão falhar
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhoto(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Limpar foto
  const clearPhoto = () => {
    setPhoto(null)
  }

  // Salvar rastreio parcialmente (antes da retirada completa)
  const saveTracking = async () => {
    if (!orderNumber) {
      setSuccess(false)
      setResult("❌ Informe o número do pedido primeiro")
      setTimeout(() => setResult(""), 5000)
      return
    }

    if (!trackingCode.trim()) {
      setSuccess(false)
      setResult("❌ Informe o código de rastreio")
      setTimeout(() => setResult(""), 5000)
      return
    }

    setLoadingTracking(true)
    try {
      const res = await fetch('/api/pickups/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber,
          trackingCode: trackingCode.trim(),
          operatorId: operatorId || null,
        }),
      })

      // Verificar se resposta é JSON
      const contentType = res.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text()
        console.error('[Tracking] Resposta não é JSON:', text)
        setSuccess(false)
        setResult(`❌ Erro no servidor\n\nStatus: ${res.status}\n${text.substring(0, 300)}`)
        setTimeout(() => setResult(""), 15000)
        return
      }

      const data = await res.json()

      if (data.ok) {
        setSuccess(true)
        setSavedTrackingCode(trackingCode.trim())
        setResult(`✅ Rastreio salvo com sucesso!\n\nPedido: ${data.order.orderNumber}\nRastreio: ${trackingCode.trim()}`)
        setTimeout(() => setResult(""), 5000)
      } else {
        setSuccess(false)
        const details = data.details ? `\n\nDetalhes: ${data.details}` : ''
        setResult(`❌ Erro ao salvar rastreio\n\n${data.error || "Erro desconhecido"}${details}`)
        setTimeout(() => setResult(""), 15000)
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro desconhecido"
      console.error('[Tracking] Erro:', error)
      setSuccess(false)
      setResult(`❌ Erro de conexão\n\n${msg}`)
      setTimeout(() => setResult(""), 15000)
    } finally {
      setLoadingTracking(false)
    }
  }

  // Validar nome do retirante
  const validateRetrieverName = (name: string): { valid: boolean; message: string } => {
    const trimmedName = name.trim()
    
    // Verificar se contém números
    if (/\d/.test(trimmedName)) {
      return { valid: false, message: "Nome do retirante não pode conter números" }
    }
    
    // Verificar se tem pelo menos nome e sobrenome (2 palavras)
    const words = trimmedName.split(/\s+/).filter(word => word.length > 0)
    if (words.length < 2) {
      return { valid: false, message: "Informe o nome completo (nome e sobrenome)" }
    }
    
    // Verificar se cada palavra tem pelo menos 2 caracteres
    if (words.some(word => word.length < 2)) {
      return { valid: false, message: "Nome e sobrenome devem ter pelo menos 2 letras cada" }
    }
    
    return { valid: true, message: "" }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!orderNumber || !cpf || !retrieverName.trim()) {
      setSuccess(false)
      setResult("❌ Preencha todos os campos obrigatórios")
      setTimeout(() => setResult(""), 10000)
      return
    }

    // Validar transportadora
    if (!transportadoraSelecionada.trim()) {
      setSuccess(false)
      setResult("❌ Selecione uma transportadora")
      setTimeout(() => setResult(""), 10000)
      return
    }

    // Validar nome do retirante
    const nameValidation = validateRetrieverName(retrieverName)
    if (!nameValidation.valid) {
      setSuccess(false)
      setResult(`❌ ${nameValidation.message}`)
      setTimeout(() => setResult(""), 10000)
      return
    }

    // Operador é obrigatório
    if (!operatorId) {
      setSuccess(false)
      setResult("❌ Selecione um operador")
      setTimeout(() => setResult(""), 10000)
      return
    }

    // Foto é obrigatória
    if (!photo) {
      setSuccess(false)
      setResult("❌ Tire uma foto do produto/documento")
      setTimeout(() => setResult(""), 10000)
      return
    }

    // Validar senha do operador
    setPendingSubmit(true)
    setShowPasswordModal(true)
  }

  const handlePasswordValidated = async () => {
    setShowPasswordModal(false)
    if (!pendingSubmit) return
    setPendingSubmit(false)

    // Validar se TODOS os itens foram conferidos
    const allItemsChecked = orderDetails && Object.values(checkedItems).every(Boolean)
    if (orderDetails && !allItemsChecked) {
      setResult("❌ Todos os produtos devem ser conferidos (marcados)")
      setSuccess(false)
      // Auto-fechar erro após 10 segundos
      setTimeout(() => setResult(""), 10000)
      return
    }
    
    setLoading(true)
    setResult("")
    setSuccess(false)
    
    // Continuar com o processo de registro

    try {
      const res = await fetch("/api/pickups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber,
          cpf,
          operatorId: operatorId,
          retrieverName: retrieverName.trim(),
          transportadora: transportadoraSelecionada.trim(),
          photo: photo || null,
          retiradaAnteriorId: retiradaAnteriorId || null,
        }),
      })

      console.log('[Retirada] Status HTTP:', res.status)
      console.log('[Retirada] Response OK:', res.ok)
      console.log('[Retirada] Content-Type:', res.headers.get('content-type'))

      // Verificar se a resposta é JSON
      const contentType = res.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text()
        console.error('[Retirada] Resposta não é JSON:', text)
        setSuccess(false)
        setResult(`❌ Erro no servidor\n\nStatus: ${res.status}\nResposta inválida (não é JSON)\n\nDetalhes: ${text.substring(0, 200)}`)
        setTimeout(() => setResult(""), 10000)
        return
      }

      const data = await res.json()
      
      console.log('[Retirada] Data:', data)
      console.log('[Retirada] Data.ok:', data.ok)
      
      if (res.ok && data.ok) {
        setSuccess(true)
        const operatorName = data.pickup?.operatorId ? operators.find(op => op.id === data.pickup.operatorId)?.name || "Não informado" : "Não informado"
        setResult(`✅ Retirada registrada com sucesso!\n\nPedido: ${data.order.orderNumber}\nID: ${data.order.tinyOrderId}\nOperador: ${operatorName}\nStatus: ${data.tiny.situacao}`)
        
        // Limpar formulário após 3 segundos
        setTimeout(() => {
          setOrderNumber("")
          setCpf("")
          setOperatorId("")
          setRetrieverName("")
          setOrderDetails(null)
          setCheckedItems({})
          setPhoto(null)
          setResult("")
        }, 3000)
      } else {
        console.error('[Retirada] Erro na resposta:', data.error)
        setSuccess(false)
        setResult(`❌ Erro ao registrar retirada\n\n${data.error || "Erro desconhecido"}`)
        // Auto-fechar erro após 10 segundos
        setTimeout(() => setResult(""), 10000)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido"
      console.error('[Retirada] Exception:', err)
      setSuccess(false)
      setResult(`❌ Erro de conexão\n\n${msg}`)
      // Auto-fechar erro após 10 segundos
      setTimeout(() => setResult(""), 10000)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordCanceled = () => {
    setShowPasswordModal(false)
    setPendingSubmit(false)
  }

  function formatCPF(value: string) {
    const digits = value.replace(/\D/g, "")
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`
  }

  return (
    <MainLayout>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto space-y-8"
          >
            {/* Header Section */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-[#FFD700]/20 rounded-2xl flex items-center justify-center mx-auto">
                <Truck className="w-8 h-8 text-[#FFD700]" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Registrar Retirada</h2>
                <p className="text-zinc-600 mt-2">
                  Informe o número do pedido e o CPF do retirante para registrar a expedição
                </p>
              </div>
            </div>

            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-2xl border border-zinc-200 p-8 shadow-sm"
            >
              <form onSubmit={onSubmit} className="space-y-6">
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-zinc-900">
                    Número do pedido (Tiny)
                  </label>
                  
                  {/* Botão de Scanner */}
                  <button
                    type="button"
                    onClick={startScanner}
                    className="w-full bg-[#FFD700] text-zinc-900 font-semibold py-4 px-6 rounded-xl hover:bg-[#FFC700] transition-all duration-200 flex items-center justify-center gap-3 shadow-sm"
                  >
                    <Camera className="w-6 h-6" />
                    <span className="text-lg">Escanear Pedido</span>
                  </button>
                  
                  <div className="text-center text-sm text-zinc-500">
                    ou digite manualmente:
                  </div>
                  
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <input
                      type="text"
                      value={orderNumber}
                      onChange={(e) => handleOrderNumberChange(e.target.value)}
                      inputMode="numeric"
                      className="w-full pl-10 pr-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent transition-all"
                      placeholder="Ex: 12345"
                      required
                    />
                    {loadingOrder && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-5 h-5 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Campo de Rastreio (Lalamove ou outro) */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-900">
                    Código de Rastreio (opcional)
                    {savedTrackingCode && (
                      <span className="ml-2 text-green-600 text-xs font-normal">✓ Salvo</span>
                    )}
                  </label>
                  <div className="relative">
                    <Truck className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <input
                      type="text"
                      value={trackingCode}
                      onChange={(e) => setTrackingCode(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent transition-all ${
                        savedTrackingCode ? 'border-green-300 bg-green-50' : 'border-zinc-200'
                      }`}
                      placeholder="Ex: https://lalamove.com/track/... ou número"
                    />
                  </div>
                  {orderNumber && trackingCode.trim() && trackingCode !== savedTrackingCode && (
                    <button
                      type="button"
                      onClick={saveTracking}
                      disabled={loadingTracking}
                      className="w-full bg-blue-500 text-white font-semibold py-3 px-4 rounded-xl hover:bg-blue-600 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loadingTracking ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Salvando...</span>
                        </>
                      ) : (
                        <>
                          <Truck className="w-5 h-5" />
                          <span>Salvar Rastreio</span>
                        </>
                      )}
                    </button>
                  )}
                  <p className="text-xs text-zinc-500">
                    Cole o link ou número de rastreio aqui. Você pode salvar o rastreio agora e completar a retirada depois.
                  </p>
                </div>

                {/* Campo de Transportadora (somente leitura) */}
                {orderDetails && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-900">
                      Transportadora
                    </label>
                    <div className="relative">
                      <Truck className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
                      <input
                        type="text"
                        value={transportadoraSelecionada || 'Não definida'}
                        readOnly
                        className="w-full pl-10 pr-4 py-3 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-600 cursor-not-allowed"
                      />
                    </div>
                    <p className="text-xs text-zinc-500">
                      Transportadora configurada no pedido da Tiny.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-900">Nome do retirante *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <input
                      type="text"
                      value={retrieverName}
                      onChange={(e) => setRetrieverName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent transition-all"
                      placeholder="Ex: João Silva"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-900">CPF do retirante *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <input
                      type="text"
                      value={cpf}
                      onChange={(e) => setCpf(formatCPF(e.target.value))}
                      inputMode="numeric"
                      className="w-full pl-10 pr-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent transition-all"
                      placeholder="Ex: 123.456.789-00"
                      maxLength={14}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-900">Operador *</label>
                  <div className="relative">
                    <Settings className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
                    <select
                      value={operatorId}
                      onChange={(e) => setOperatorId(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent transition-all appearance-none bg-white"
                    >
                      <option value="">Selecione um operador</option>
                      {operators.map(op => (
                        <option key={op.id} value={op.id}>{op.name}</option>
                      ))}
                    </select>
                  </div>
                  {operators.length === 0 && (
                    <p className="text-xs text-zinc-500">
                      Nenhum operador cadastrado.
                    </p>
                  )}
                </div>

                {/* Campo de Foto */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-900">Foto do Produto/Documento *</label>
                  <div className="space-y-3">
                    <label className="w-full bg-[#FFD700] text-zinc-900 font-semibold py-3 px-6 rounded-xl hover:bg-[#FFC700] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer">
                      <span className="text-2xl">📷</span>
                      <span>{photo ? 'Tirar nova foto' : 'Tirar foto'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handlePhotoCapture}
                        className="hidden"
                      />
                    </label>
                    {photo && (
                      <div className="relative">
                        <img src={photo} alt="Preview" className="w-full h-48 object-cover rounded-lg border border-zinc-200" />
                        <button
                          type="button"
                          onClick={clearPhoto}
                          className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Painel de Informações do Pedido */}
                {orderDetails && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-zinc-200 rounded-xl p-6 space-y-4 bg-zinc-50"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-zinc-900">📦 Pedido #{orderDetails.numero}</h3>
                      <span className="text-sm text-zinc-600">Cliente: {orderDetails.clienteNome}</span>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-zinc-700">Produtos: *</p>
                      {orderDetails.itens.map(item => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-3 bg-white rounded-lg border border-zinc-200"
                        >
                          <input
                            type="checkbox"
                            checked={checkedItems[item.id] || false}
                            onChange={(e) => {
                              e.stopPropagation()
                              toggleItem(item.id)
                            }}
                            className="w-5 h-5 rounded border-zinc-300 text-[#FFD700] focus:ring-[#FFD700] cursor-pointer"
                          />
                          <Package className="w-5 h-5 text-zinc-400 shrink-0" />
                          <div className="flex-1">
                            <span className="text-sm font-medium text-zinc-900">{item.descricao}</span>
                            <span className="text-sm text-zinc-600 ml-2">(Quant: {item.quantidade})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#FFD700] text-zinc-900 font-semibold py-3 px-6 rounded-xl hover:bg-[#FFC700] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
                      <span>Processando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Confirmar Retirada</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>

            {/* Modal de Resultado */}
            {result && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className={`w-full max-w-md rounded-2xl border p-6 shadow-xl ${
                    success 
                      ? "bg-green-50 border-green-200" 
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {success ? (
                      <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 shrink-0" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-red-600 mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1">
                      <h3 className={`font-semibold text-lg ${success ? "text-green-900" : "text-red-900"}`}>
                        {success ? "Retirada Registrada!" : "Erro na Operação"}
                      </h3>
                      <pre className={`mt-2 text-sm whitespace-pre-wrap ${success ? "text-green-700" : "text-red-700"}`}>
                        {result}
                      </pre>
                    </div>
                    <button
                      onClick={() => setResult("")}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        success
                          ? "hover:bg-green-200 text-green-900"
                          : "hover:bg-red-200 text-red-900"
                      }`}
                    >
                      <span className="text-xl font-bold">×</span>
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>

          {/* Modal de Scanner */}
          {showScanner && (
            <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
              <div className="p-4 bg-[#FFD700] flex items-center justify-between">
                <h3 className="font-semibold text-zinc-900 text-lg">Escanear Pedido</h3>
                <button
                  onClick={stopScanner}
                  className="w-10 h-10 bg-zinc-900 text-white rounded-lg flex items-center justify-center hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center p-4">
                <div id="barcode-reader" className="w-full max-w-md rounded-lg overflow-hidden bg-black"></div>
                {scannerError ? (
                  <p className="text-red-400 mt-4 text-center">{scannerError}</p>
                ) : (
                  <p className="text-white mt-4 text-center">
                    Aponte a câmera para o código de barras do pedido
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Modal de Bloqueio por Status */}
          {showBlockedModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-md bg-white rounded-2xl border border-red-200 shadow-xl overflow-hidden"
              >
                {/* Header com X para fechar */}
                <div className="bg-red-500 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 text-white" />
                    <h3 className="font-bold text-lg text-white">Pedido Bloqueado</h3>
                  </div>
                  <button
                    onClick={() => {
                      setShowBlockedModal(false)
                      setOrderNumber("")
                    }}
                    className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
                
                {/* Conteúdo */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                      <Package className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-red-600 font-medium">Status do Pedido</p>
                      <p className="text-lg font-bold text-red-700 uppercase">{blockedStatus}</p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-zinc-50 rounded-xl">
                    <p className="text-zinc-700 font-medium">Motivo do Bloqueio:</p>
                    <p className="text-zinc-600 mt-1">{blockedMessage}</p>
                  </div>
                  
                  <p className="text-sm text-zinc-500 text-center">
                    Feche esta janela para tentar outro pedido.
                  </p>
                </div>
              </motion.div>
            </div>
          )}

          {/* Modal de Validação de Senha */}
          {showPasswordModal && operatorId && (
            <PasswordValidationModal
              operatorId={operatorId}
              operatorName={operators.find(op => op.id === operatorId)?.name || 'Operador'}
              onValidate={handlePasswordValidated}
              onCancel={handlePasswordCanceled}
            />
          )}
        </MainLayout>
      )
    }
