"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Package, TrendingUp, Users, Truck, BarChart3, RotateCcw } from "lucide-react"
import Link from "next/link"
import MainLayout from "@/components/MainLayout"
import DateFilter, { DateFilterOption } from "@/components/DateFilter"
import StatsCard from "@/components/StatsCard"

export default function Home() {
  const router = useRouter()
  const [stats, setStats] = useState({
    retiradasHoje: 0,
    retiradasSemana: 0,
    totalPedidos: 0,
    totalOperadores: 0,
    retornos: 0,
    reRetiradasPendentes: 0
  })
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('hoje')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [checkingRole, setCheckingRole] = useState(true)

  // Verificar role do usuário e redirecionar se for OPERATOR
  useEffect(() => {
    async function checkUserRole() {
      try {
        const response = await fetch('/api/user/me')
        if (response.ok) {
          const userData = await response.json()
          
          // Se for OPERATOR, redirecionar para expedição
          if (userData.role === 'OPERATOR' || userData.role === 'EXPEDICAO' || userData.role === 'CORTE_SOLDA') {
            router.replace('/expedicao/retirada')
            return
          }
        }
      } catch (error) {
        console.error('Erro ao verificar role:', error)
      } finally {
        setCheckingRole(false)
      }
    }
    
    checkUserRole()
  }, [router])

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      
      // Calcular datas baseado no filtro
      let startDate = new Date()
      let endDate = new Date()
      
      switch (dateFilter) {
        case 'hoje':
          startDate.setHours(0, 0, 0, 0)
          break
        case 'semana':
          startDate.setDate(startDate.getDate() - 7)
          break
        case '14dias':
          startDate.setDate(startDate.getDate() - 14)
          break
        case '30dias':
          startDate.setDate(startDate.getDate() - 30)
          break
        case 'personalizado':
          if (customStartDate && customEndDate) {
            startDate = new Date(customStartDate)
            endDate = new Date(customEndDate)
            endDate.setHours(23, 59, 59, 999)
          }
          break
      }
      
      // Buscar retiradas
      const retiradasRes = await fetch('/api/retiradas?limit=1000')
      const retiradasData = await retiradasRes.json()
      
      if (retiradasData.ok) {
        const retiradas = retiradasData.retiradas || []
        const hoje = new Date().toDateString()
        const inicioSemana = new Date()
        inicioSemana.setDate(inicioSemana.getDate() - 7)
        
        // Filtrar retiradas pelo período selecionado
        const retiradasFiltradas = retiradas.filter((r: Record<string, any>) => {
          const dataRetirada = new Date(r.createdAt)
          return dataRetirada >= startDate && dataRetirada <= endDate
        })
        
        const retiradasHoje = retiradas.filter((r: Record<string, any>) => 
          new Date(r.createdAt).toDateString() === hoje
        ).length
        
        const retiradasSemana = retiradas.filter((r: Record<string, any>) => 
          new Date(r.createdAt) >= inicioSemana
        ).length
        
        // Contar retornos e re-retiradas pendentes
        const retornos = retiradas.filter((r: Record<string, any>) => 
          r.status === 'RETORNADO'
        ).length
        
        const reRetiradasPendentes = retiradas.filter((r: Record<string, any>) => 
          r.status === 'RETORNADO'
        ).length
        
        setStats(prev => ({
          ...prev,
          retiradasHoje,
          retiradasSemana,
          totalPedidos: retiradasFiltradas.length,
          retornos,
          reRetiradasPendentes
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
  }, [dateFilter, customStartDate, customEndDate])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // Mostrar loading enquanto verifica role
  if (checkingRole) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-zinc-600">Carregando...</div>
      </div>
    )
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

            {/* Date Filter */}
            <DateFilter
              value={dateFilter}
              onChange={setDateFilter}
              onCustomDateChange={(start, end) => {
                setCustomStartDate(start)
                setCustomEndDate(end)
              }}
            />

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                title="Retiradas Hoje"
                value={stats.retiradasHoje}
                subtitle="registradas"
                icon={TrendingUp}
                iconBgColor="bg-green-100"
                iconColor="text-green-600"
                delay={0.1}
                loading={loading}
              />

              <StatsCard
                title="Esta Semana"
                value={stats.retiradasSemana}
                subtitle="retiradas"
                icon={Package}
                iconBgColor="bg-blue-100"
                iconColor="text-blue-600"
                delay={0.2}
                loading={loading}
              />

              <StatsCard
                title="Operadores"
                value={stats.totalOperadores}
                subtitle="cadastrados"
                icon={Users}
                iconBgColor="bg-purple-100"
                iconColor="text-purple-600"
                delay={0.3}
                loading={loading}
              />

              <StatsCard
                title="Expedição"
                value={stats.retiradasHoje}
                subtitle="hoje"
                icon={Truck}
                iconBgColor="bg-[#FFD700]/20"
                iconColor="text-[#FFD700]"
                delay={0.4}
                loading={loading}
              />

              <StatsCard
                title="Retornos"
                value={stats.retornos}
                subtitle="aguardando"
                icon={RotateCcw}
                iconBgColor="bg-amber-100"
                iconColor="text-amber-600"
                delay={0.5}
                loading={loading}
              />
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
