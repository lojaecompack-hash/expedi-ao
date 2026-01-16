'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function OperadoresPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/usuarios')
  }, [router])

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <div className="text-zinc-600">Redirecionando para Usuários...</div>
    </div>
  )
}
