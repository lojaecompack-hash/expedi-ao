"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { Package, Truck } from "lucide-react"

type UserRole = 'ADMIN' | 'EXPEDICAO' | null

export default function Sidebar() {
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<UserRole>(null)

  useEffect(() => {
    // Buscar role do usuário
    fetch('/api/user-role')
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          setUserRole(data.role)
        }
      })
      .catch(err => console.error('Erro ao buscar role:', err))
  }, [])

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/'
    return pathname.startsWith(path)
  }

  // Se for EXPEDICAO, não mostra sidebar (ou mostra versão mínima)
  if (userRole === 'EXPEDICAO') {
    return (
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
          <Link 
            href="/expedicao/retirada" 
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#FFD700] text-zinc-900"
          >
            <Truck className="w-5 h-5" />
            <span className="font-medium">Expedição</span>
          </Link>
        </nav>
      </aside>
    )
  }

  // Menu completo para ADMIN
  return (
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
        <Link 
          href="/" 
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
            isActive('/') && pathname === '/'
              ? 'bg-[#FFD700] text-zinc-900' 
              : 'hover:bg-zinc-100 text-zinc-700'
          }`}
        >
          <Package className="w-5 h-5" />
          <span className="font-medium">Dashboard</span>
        </Link>

        <Link 
          href="/expedicao/retirada" 
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
            isActive('/expedicao/retirada')
              ? 'bg-[#FFD700] text-zinc-900' 
              : 'hover:bg-zinc-100 text-zinc-700'
          }`}
        >
          <Truck className="w-5 h-5" />
          <span className="font-medium">Expedição</span>
        </Link>

        <Link 
          href="/expedicao/operadores" 
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
            isActive('/expedicao/operadores')
              ? 'bg-[#FFD700] text-zinc-900' 
              : 'hover:bg-zinc-100 text-zinc-700'
          }`}
        >
          <Package className="w-5 h-5" />
          <span className="font-medium">Operadores</span>
        </Link>

        <Link 
          href="/admin/relatorios/retiradas" 
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
            isActive('/admin/relatorios')
              ? 'bg-[#FFD700] text-zinc-900' 
              : 'hover:bg-zinc-100 text-zinc-700'
          }`}
        >
          <Package className="w-5 h-5" />
          <span className="font-medium">Relatórios</span>
        </Link>

        <Link 
          href="/setup/tiny" 
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
            isActive('/setup/tiny')
              ? 'bg-[#FFD700] text-zinc-900' 
              : 'hover:bg-zinc-100 text-zinc-700'
          }`}
        >
          <Package className="w-5 h-5" />
          <span className="font-medium">Configurações</span>
        </Link>
      </nav>
    </aside>
  )
}
