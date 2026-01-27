"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Package, Truck, Users, BarChart3, Wrench, Home, LogOut, Factory, Menu, X, ChevronLeft, ChevronRight } from "lucide-react"

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
  const [menuCollapsed, setMenuCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('menuCollapsed') === 'true'
    }
    return false
  })

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

  const toggleMenu = () => {
    const newState = !menuCollapsed
    setMenuCollapsed(newState)
    if (typeof window !== 'undefined') {
      localStorage.setItem('menuCollapsed', String(newState))
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
      <aside className={`fixed left-0 top-0 z-50 h-screen bg-white border-r border-zinc-200 transition-all duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 ${
        menuCollapsed ? 'lg:w-16' : 'lg:w-60'
      }`}>
        <div className="hidden lg:flex h-14 items-center justify-between px-4 border-b border-zinc-200">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#FFD700] rounded-lg flex items-center justify-center flex-shrink-0">
              <Package className="w-4 h-4 text-zinc-900" />
            </div>
            {!menuCollapsed && <span className="text-sm font-bold text-zinc-900">Ecompack</span>}
          </div>
          <button
            onClick={toggleMenu}
            className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors"
            title={menuCollapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {menuCollapsed ? 
              <ChevronRight className="w-4 h-4 text-zinc-600" /> : 
              <ChevronLeft className="w-4 h-4 text-zinc-600" />
            }
          </button>
        </div>
        
        <nav className="p-2 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href) && (item.href === '/' ? pathname === '/' : true)
            
            return (
              <div key={item.href} className="relative group">
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-tiny ${
                    active
                      ? 'bg-[#FFD700] text-zinc-900'
                      : 'hover:bg-zinc-100 text-zinc-700'
                  } ${
                    menuCollapsed ? 'justify-center' : ''
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {!menuCollapsed && <span className="font-medium">{item.label}</span>}
                </Link>
                {menuCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-zinc-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* User info and logout */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-zinc-200 bg-white">
          {!menuCollapsed ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 bg-zinc-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-zinc-700">
                    {userEmail?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-zinc-900 truncate">
                    {userEmail || 'Usuário'}
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    {userRole === 'ADMIN' ? 'Administrador' : userRole === 'PRODUCAO' ? 'Produção' : userRole === 'EXPEDICAO' ? 'Expedição' : 'Carregando...'}
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-2 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair</span>
              </button>
            </>
          ) : (
            <div className="relative group">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center p-2 text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
              <div className="absolute left-full ml-2 bottom-0 px-2 py-1 bg-zinc-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                Sair
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className={`pt-16 lg:pt-0 transition-all duration-300 ${
        menuCollapsed ? 'lg:pl-16' : 'lg:pl-60'
      }`}>
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
