"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Package, TrendingUp, Users, Truck, BarChart3 } from "lucide-react"
import Link from "next/link"
import MainLayout from "@/components/MainLayout"

export default function Home() {
  const [stats, setStats] = useState({
    retiradasHoje: 0,
    retiradasSemana: 0,
    totalPedidos: 0,
    totalOperadores: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // Buscar retiradas
      const retiradasRes = await fetch('/api/retiradas?limit=1000')
      const retiradasData = await retiradasRes.json()
      
      if (retiradasData.ok) {
        const retiradas = retiradasData.retiradas || []
        const hoje = new Date().toDateString()
        const inicioSemana = new Date()
        inicioSemana.setDate(inicioSemana.getDate() - 7)
        
        const retiradasHoje = retiradas.filter((r: any) => 
          new Date(r.createdAt).toDateString() === hoje
        ).length
        
        const retiradasSemana = retiradas.filter((r: any) => 
          new Date(r.createdAt) >= inicioSemana
        ).length
        
        setStats(prev => ({
          ...prev,
          retiradasHoje,
          retiradasSemana
        }))
      }

      // Buscar operadores
      const operadoresRes = await fetch('/api/operators')
      const operadoresData = await operadoresRes.json()
      
      if (operadoresData.ok) {
        setStats(prev => ({
          ...prev,
          totalOperadores: operadoresData.operators?.length || 0
        }))
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout>
      <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            {/* Page Title */}
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Dashboard</h1>
              <p className="text-zinc-600 mt-2">Visão geral do seu e-commerce</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-white rounded-2xl border border-zinc-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-600">Retiradas Hoje</p>
                    <p className="text-2xl font-bold text-zinc-900 mt-1">{loading ? '...' : stats.retiradasHoje}</p>
                    <p className="text-sm text-zinc-600 mt-2">registradas</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-2xl border border-zinc-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-600">Esta Semana</p>
                    <p className="text-2xl font-bold text-zinc-900 mt-1">{loading ? '...' : stats.retiradasSemana}</p>
                    <p className="text-sm text-zinc-600 mt-2">retiradas</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-white rounded-2xl border border-zinc-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-600">Operadores</p>
                    <p className="text-2xl font-bold text-zinc-900 mt-1">{loading ? '...' : stats.totalOperadores}</p>
                    <p className="text-sm text-zinc-600 mt-2">cadastrados</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-white rounded-2xl border border-zinc-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-600">Expedição</p>
                    <p className="text-2xl font-bold text-zinc-900 mt-1">{loading ? '...' : stats.retiradasHoje}</p>
                    <p className="text-sm text-zinc-600 mt-2">hoje</p>
                  </div>
                  <div className="w-12 h-12 bg-[#FFD700]/20 rounded-xl flex items-center justify-center">
                    <Truck className="w-6 h-6 text-[#FFD700]" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="bg-white rounded-2xl border border-zinc-200 p-6"
            >
              <h2 className="text-lg font-semibold text-zinc-900 mb-4">Ações Rápidas</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/expedicao/retirada" className="flex items-center gap-3 p-4 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors">
                  <div className="w-10 h-10 bg-[#FFD700]/20 rounded-xl flex items-center justify-center">
                    <Truck className="w-5 h-5 text-[#FFD700]" />
                  </div>
                  <div>
                    <p className="font-medium text-zinc-900">Nova Retirada</p>
                    <p className="text-sm text-zinc-600">Registrar expedição</p>
                  </div>
                </Link>
                
                <button className="flex items-center gap-3 p-4 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-zinc-900">Importar Pedidos</p>
                    <p className="text-sm text-zinc-600">Sincronizar Tiny</p>
                  </div>
                </button>
                
                <Link href="/admin/relatorios/retiradas" className="flex items-center gap-3 p-4 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-zinc-900">Ver Relatórios</p>
                    <p className="text-sm text-zinc-600">Análise completa</p>
                  </div>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </MainLayout>
    )
  }
