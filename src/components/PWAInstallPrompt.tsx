"use client"

import { useEffect, useState } from 'react'
import { X, Download } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Verificar se já foi instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return
    }

    // Verificar se já mostrou o prompt antes
    const hasSeenPrompt = localStorage.getItem('pwa-install-prompt-seen')
    if (hasSeenPrompt) {
      return
    }

    // Capturar evento de instalação
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Mostrar prompt após 3 segundos
      setTimeout(() => {
        setShowPrompt(true)
      }, 3000)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('PWA instalado')
    }

    setDeferredPrompt(null)
    setShowPrompt(false)
    localStorage.setItem('pwa-install-prompt-seen', 'true')
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-install-prompt-seen', 'true')
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-slide-up">
      <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-[#FFD700] rounded-xl flex items-center justify-center shrink-0">
            <Download className="w-6 h-6 text-zinc-900" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-zinc-900 mb-1">
              Instalar App
            </h3>
            <p className="text-sm text-zinc-600 mb-4">
              Instale o app na tela inicial para acesso rápido e uso offline
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="flex-1 bg-[#FFD700] text-zinc-900 font-semibold py-2 px-4 rounded-lg hover:bg-[#FFC700] transition-colors"
              >
                Instalar
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-zinc-600 hover:text-zinc-900 transition-colors"
              >
                Agora não
              </button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
