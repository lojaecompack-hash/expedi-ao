'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HistoricoPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/admin/relatorios/retiradas')
  }, [router])

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <div className="text-zinc-600">Redirecionando para Relatórios...</div>
    </div>
  )
}
