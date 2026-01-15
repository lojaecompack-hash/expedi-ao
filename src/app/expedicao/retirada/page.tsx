"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Package, Truck, CheckCircle, AlertCircle, ArrowLeft, Search, User, Settings } from "lucide-react"
import Link from "next/link"

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

export default function RetiradaPage() {
  const [orderNumber, setOrderNumber] = useState("")
  const [cpf, setCpf] = useState("")
  const [operator, setOperator] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>("")
  const [success, setSuccess] = useState(false)
  
  // Estados para busca automática
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null)
  const [loadingOrder, setLoadingOrder] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)

  // Função para buscar detalhes do pedido via API
  const searchOrder = async (number: string) => {
    console.log('[Client] Iniciando busca para pedido:', number)
    
    if (number.length < 2) {
      console.log('[Client] Número muito curto, limpando detalhes')
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
    } catch (error) {
      console.error('[Client] Erro ao buscar pedido:', error)
      setOrderDetails(null)
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult("")
    setSuccess(false)

    try {
      const res = await fetch("/api/pickups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber,
          cpf,
          operator: operator.trim() ? operator : undefined,
        }),
      })

      const data = await res.json()
      
      if (res.ok && data.ok) {
        setSuccess(true)
        setResult(`✅ Retirada registrada com sucesso!\n\nPedido: ${data.order.orderNumber}\nID: ${data.order.tinyOrderId}\nOperador: ${data.pickup.operator || "Não informado"}\nStatus: ${data.tiny.situacao}`)
        setOrderNumber("")
        setCpf("")
        setOperator("")
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

  function formatCPF(value: string) {
    const digits = value.replace(/\D/g, "")
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`
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
            <Search className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link href="/expedicao/retirada" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#FFD700] text-zinc-900">
            <Truck className="w-5 h-5" />
            <span className="font-medium">Expedição</span>
          </Link>
          <Link href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-100 text-zinc-700 transition-colors">
            <Package className="w-5 h-5" />
            <span className="font-medium">Pedidos</span>
          </Link>
          <Link href="/setup/tiny" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-100 text-zinc-700 transition-colors">
            <Settings className="w-5 h-5" />
            <span className="font-medium">Configurações</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-zinc-200">
          <div className="flex h-16 items-center justify-between px-8">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span>Voltar</span>
              </Link>
              <div className="h-6 w-px bg-zinc-200"></div>
              <h1 className="text-xl font-semibold text-zinc-900">Expedição - Retirada</h1>
            </div>
          </div>
        </header>

        {/* Form Content */}
        <main className="p-8">
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
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-900">Número do pedido (Tiny)</label>
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
                  <label className="block text-sm font-medium text-zinc-900">CPF do retirante</label>
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
                    <Settings className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <input
                      type="text"
                      value={operator}
                      onChange={(e) => setOperator(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent transition-all"
                      placeholder="Ex: João"
                    />
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
                      <p className="text-sm font-medium text-zinc-700">Produtos:</p>
                      {orderDetails.itens.map(item => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-3 bg-white rounded-lg border border-zinc-200"
                        >
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
        </main>
      </div>
    </div>
  )
}
