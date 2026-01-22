"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Package, Truck, Users, BarChart3, Wrench, Home, LogOut, Factory, Menu, X } from "lucide-react"

type UserRole = 'ADMIN' | 'EXPEDICAO' | 'PRODUCAO' | null

interface MainLayoutProps {
  children: React.ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [userRole, setUserRole] = useState<UserRole>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    fetchUserRole()
  }, [])

  const fetchUserRole = async () => {
    try {
      console.log('[MainLayout] Buscando role do usuário...')
      const res = await fetch('/api/user-role')
      const data = await res.json()
      
      console.log('[MainLayout] Resposta da API:', data)
      
      if (data.ok) {
        console.log('[MainLayout] Role recebida:', data.role)
        setUserRole(data.role)
        setUserEmail(data.email || '')
      } else {
        console.error('[MainLayout] API retornou erro:', data.error)
      }
    } catch (error) {
      console.error('[MainLayout] Erro ao buscar role:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' })
      router.push('/login')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/'
    return pathname.startsWith(path)
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F9FAFB]">
        <div className="text-zinc-600">Carregando...</div>
      </div>
    )
  }

  // Menu items - ADMIN vê tudo, EXPEDICAO vê Dashboard/Retirada/Relatórios, PRODUCAO vê Dashboard
  const menuItems = userRole === 'ADMIN' ? [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/producao', label: 'Produção', icon: Factory },
    { href: '/expedicao/retirada', label: 'Retirada', icon: Truck },
    { href: '/admin/relatorios/retiradas', label: 'Relatórios', icon: BarChart3 },
    { href: '/usuarios', label: 'Usuários', icon: Users },
    { href: '/setup/tiny', label: 'Configurações', icon: Wrench },
  ] : userRole === 'PRODUCAO' ? [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/producao', label: 'Produção', icon: Factory },
    { href: '/producao/conferencia', label: 'Conferência', icon: BarChart3 },
  ] : [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/expedicao/retirada', label: 'Retirada', icon: Truck },
    { href: '/admin/relatorios/retiradas', label: 'Relatórios', icon: BarChart3 },
  ]

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#FFD700] rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-zinc-900" />
          </div>
          <span className="text-xl font-semibold text-zinc-900">Ecompack</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 z-50 h-screen w-64 bg-white border-r border-zinc-200 transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="hidden lg:flex h-16 items-center px-6 border-b border-zinc-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#FFD700] rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-zinc-900" />
            </div>
            <span className="text-xl font-semibold text-zinc-900">Ecompack</span>
          </div>
        </div>
        
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href) && (item.href === '/' ? pathname === '/' : true)
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  active
                    ? 'bg-[#FFD700] text-zinc-900'
                    : 'hover:bg-zinc-100 text-zinc-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User info and logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-zinc-200 bg-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-zinc-200 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-zinc-700">
                {userEmail?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-zinc-900 truncate">
                {userEmail || 'Usuário'}
              </div>
              <div className="text-xs text-zinc-500">
                {userRole === 'ADMIN' ? 'Administrador' : userRole === 'PRODUCAO' ? 'Produção' : userRole === 'EXPEDICAO' ? 'Expedição' : 'Carregando...'}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="pt-16 lg:pt-0 lg:pl-64">
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
