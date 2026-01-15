"use client"

import { motion } from "framer-motion"
import { Package, TrendingUp, Users, Truck, Search, Bell, Settings, Home as HomeIcon, BarChart3, ClipboardList, Wrench } from "lucide-react"
import Link from "next/link"

export default function Home() {
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
          <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#FFD700] text-zinc-900">
            <HomeIcon className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link href="/expedicao/retirada" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-100 text-zinc-700 transition-colors">
            <Truck className="w-5 h-5" />
            <span className="font-medium">Expedição</span>
          </Link>
          <Link href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-100 text-zinc-700 transition-colors">
            <ClipboardList className="w-5 h-5" />
            <span className="font-medium">Pedidos</span>
          </Link>
          <Link href="/admin/relatorios/retiradas" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-100 text-zinc-700 transition-colors">
            <BarChart3 className="w-5 h-5" />
            <span className="font-medium">Relatórios</span>
          </Link>
          <Link href="/admin/usuarios" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-100 text-zinc-700 transition-colors">
            <Users className="w-5 h-5" />
            <span className="font-medium">Usuários</span>
          </Link>
          <Link href="/setup/tiny" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-100 text-zinc-700 transition-colors">
            <Wrench className="w-5 h-5" />
            <span className="font-medium">Configurações</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-zinc-200">
          <div className="flex h-16 items-center justify-between px-8">
            <div className="flex items-center gap-4 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Buscar pedidos, produtos..."
                  className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="relative p-2 rounded-xl hover:bg-zinc-100 transition-colors">
                <Bell className="w-5 h-5 text-zinc-700" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="p-2 rounded-xl hover:bg-zinc-100 transition-colors">
                <Settings className="w-5 h-5 text-zinc-700" />
              </button>
              <div className="w-8 h-8 bg-zinc-200 rounded-full"></div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-8">
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
                    <p className="text-sm text-zinc-600">Vendas Hoje</p>
                    <p className="text-2xl font-bold text-zinc-900 mt-1">R$ 12.450</p>
                    <p className="text-sm text-green-600 mt-2">+12% vs ontem</p>
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
                    <p className="text-sm text-zinc-600">Pedidos</p>
                    <p className="text-2xl font-bold text-zinc-900 mt-1">248</p>
                    <p className="text-sm text-zinc-600 mt-2">18 pendentes</p>
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
                    <p className="text-sm text-zinc-600">Clientes</p>
                    <p className="text-2xl font-bold text-zinc-900 mt-1">1.842</p>
                    <p className="text-sm text-green-600 mt-2">+23 este mês</p>
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
                    <p className="text-2xl font-bold text-zinc-900 mt-1">142</p>
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
        </main>
      </div>
    </div>
  )
}
