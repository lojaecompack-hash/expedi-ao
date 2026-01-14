'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface User {
  id: string
  email: string
}

interface Membership {
  permissions: string[]
}

interface SessionData {
  authenticated: boolean
  user: User | null
  membership?: Membership | null
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [session, setSession] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/session')
      .then((res) => res.json())
      .then((data) => {
        setSession(data)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [])

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' })
    router.push('/login')
  }

  const hasPermission = (permission: string) => {
    return session?.membership?.permissions?.includes(permission) || false
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '🏠', permission: null },
    { href: '/expedicao/retirada', label: 'Retirada', icon: '📦', permission: 'EXPEDICAO' },
    { href: '/expedicao/historico', label: 'Histórico', icon: '📋', permission: 'EXPEDICAO' },
    { href: '/settings/integrations/tiny', label: 'Settings', icon: '⚙️', permission: 'SETTINGS' },
  ]

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-500">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Tiny Expedição</h1>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            if (item.permission && !hasPermission(item.permission) && !hasPermission('ADMIN')) {
              return null
            }

            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </a>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-700 font-medium">
                {session?.user?.email?.[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {session?.user?.email}
              </div>
              {session?.membership?.permissions && (
                <div className="text-xs text-gray-500">
                  {session.membership.permissions.join(', ')}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">{children}</div>
      </main>
    </div>
  )
}
