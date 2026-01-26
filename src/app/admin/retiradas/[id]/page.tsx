"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Package, Truck, User, Calendar, ArrowLeft, Image as ImageIcon } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

interface Retirada {
  id: string
  cpfLast4: string | null
  operatorId: string | null
  operatorName: string | null
  customerName: string | null
  customerCpfCnpj: string | null
  retrieverName: string | null
  trackingCode: string | null
  photo: string | null
  createdAt: string
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
  const id = params.id as string
  
  const [retirada, setRetirada] = useState<Retirada | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchRetirada()
    }
  }, [id])

  const fetchRetirada = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/retiradas/${id}`)
      const data = await res.json()
      
      if (data.ok) {
        setRetirada(data.retirada)
      }
    } catch (error) {
      console.error('Erro ao buscar retirada:', error)
    } finally {
      setLoading(false)
    }
  }

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
          </motion.div>

          {/* Dados da Retirada */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-zinc-200 p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                <Truck className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-zinc-900">Dados da Retirada</h2>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-zinc-600 mb-1">Nome do Retirante</p>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-zinc-400" />
                  <p className="text-lg font-semibold text-zinc-900">{retirada.retrieverName || 'Não informado'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-zinc-600 mb-1">CPF</p>
                <p className="text-lg font-semibold text-zinc-900">{retirada.customerCpfCnpj || retirada.cpfLast4 || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-600 mb-1">Operador</p>
                <p className="text-lg font-semibold text-zinc-900">{retirada.operatorName || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-600 mb-1">Data da Retirada</p>
                <div className="flex items-center gap-2 text-zinc-900">
                  <Calendar className="w-4 h-4" />
                  <span className="font-semibold">{new Date(retirada.createdAt).toLocaleString('pt-BR')}</span>
                </div>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-zinc-600 mb-1">Código de Rastreio</p>
                {retirada.trackingCode ? (
                  retirada.trackingCode.startsWith('http') ? (
                    <a 
                      href={retirada.trackingCode} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-lg font-semibold flex items-center gap-2"
                    >
                      <Truck className="w-5 h-5" />
                      Abrir rastreio
                    </a>
                  ) : (
                    <p className="text-lg font-semibold text-zinc-900">{retirada.trackingCode}</p>
                  )
                ) : (
                  <p className="text-lg font-semibold text-zinc-400">Não informado</p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Foto */}
          {retirada.photo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border border-zinc-200 p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-zinc-900">Foto do Produto/Documento</h2>
              </div>

              <div className="rounded-xl overflow-hidden border border-zinc-200">
                <img 
                  src={retirada.photo} 
                  alt="Foto da retirada" 
                  className="w-full h-auto object-contain max-h-96"
                />
              </div>
            </motion.div>
          )}

          {!retirada.photo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border border-zinc-200 p-8 text-center"
            >
              <ImageIcon className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
              <p className="text-zinc-600">Nenhuma foto foi tirada nesta retirada</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
