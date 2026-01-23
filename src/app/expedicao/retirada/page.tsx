"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { CheckCircle, AlertCircle, User, Settings, Package, Truck, Camera } from "lucide-react"
import MainLayout from "@/components/MainLayout"
import PasswordValidationModal from "@/components/PasswordValidationModal"

interface OrderDetails {
  id: string
  numero: string
  clienteNome: string
  itens: Array<{
    id: string
    descricao: string
    quantidade: number
  }>
}

interface Operator {
  id: string
  name: string
  isActive: boolean
}

export default function RetiradaPage() {
  const [orderNumber, setOrderNumber] = useState("")
  const [cpf, setCpf] = useState("")
  const [operatorId, setOperatorId] = useState("")
  const [retrieverName, setRetrieverName] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>("")
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
  
  // Ref para input de scanner
  const scannerInputRef = useRef<HTMLInputElement>(null)
  
  useEffect(() => {
    fetchOperators()
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
      setOrderDetails(details)
      
      // Inicializar checkboxes desmarcados
      const initialChecks: Record<string, boolean> = {}
      details.itens.forEach((item: { id: string }) => {
        initialChecks[item.id] = false
      })
      setCheckedItems(initialChecks)
    } catch (error) {
      console.error('[Client] Erro ao buscar pedido:', error)
      setOrderDetails(null)
      setCheckedItems({})
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
  
  // Abrir câmera para escanear
  const handleScanClick = () => {
    scannerInputRef.current?.click()
  }
  
  // Processar imagem escaneada
  const handleScanCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Por enquanto, vamos pedir ao usuário digitar o número
    // TODO: Implementar OCR para ler código de barras da imagem
    const number = prompt('Digite o número do pedido que aparece no código de barras:')
    if (number) {
      setOrderNumber(number)
      searchOrder(number)
    }
    
    // Limpar input para permitir nova captura
    e.target.value = ''
  }

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

  // Capturar foto via input file
  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setPhoto(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Limpar foto
  const clearPhoto = () => {
    setPhoto(null)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!orderNumber || !cpf || !retrieverName.trim()) {
      setSuccess(false)
      setResult("❌ Preencha todos os campos obrigatórios")
      return
    }

    if (!operatorId) {
      setSuccess(false)
      setResult("❌ Selecione um operador")
      return
    }

    // Mostrar modal de validação de senha
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
          photo: photo || null,
        }),
      })

      const data = await res.json()
      
      if (res.ok && data.ok) {
        setSuccess(true)
        setResult(`✅ Retirada registrada com sucesso!\n\nPedido: ${data.order.orderNumber}\nID: ${data.order.tinyOrderId}\nOperador: ${data.pickup.operator || "Não informado"}\nStatus: ${data.tiny.situacao}`)
        setOrderNumber("")
        setCpf("")
        setOperatorId("")
        setRetrieverName("")
        setOrderDetails(null)
        setCheckedItems({})
        setPhoto(null)
      } else {
        setSuccess(false)
        setResult(`❌ Erro ao registrar retirada\n\n${data.error || "Erro desconhecido"}`)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido"
      setSuccess(false)
      setResult(`❌ Erro de conexão\n\n${msg}`)
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
                    onClick={handleScanClick}
                    className="w-full bg-[#FFD700] text-zinc-900 font-semibold py-4 px-6 rounded-xl hover:bg-[#FFC700] transition-all duration-200 flex items-center justify-center gap-3 shadow-sm"
                  >
                    <Camera className="w-6 h-6" />
                    <span className="text-lg">Escanear Pedido</span>
                  </button>
                  <input
                    ref={scannerInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleScanCapture}
                    className="hidden"
                  />
                  
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
                  <label className="block text-sm font-medium text-zinc-900">Operador (opcional)</label>
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
                  <label className="block text-sm font-medium text-zinc-900">Foto do Produto/Documento</label>
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

            {/* Result */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={`rounded-2xl border p-6 ${
                  success 
                    ? "bg-green-50 border-green-200" 
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  {success ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h3 className={`font-semibold ${success ? "text-green-900" : "text-red-900"}`}>
                      {success ? "Retirada Registrada!" : "Erro na Operação"}
                    </h3>
                    <pre className={`mt-2 text-sm whitespace-pre-wrap ${success ? "text-green-700" : "text-red-700"}`}>
                      {result}
                    </pre>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Modal de Validação de Senha */
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
