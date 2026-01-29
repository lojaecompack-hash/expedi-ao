'use client'

import { useState } from 'react'
import { HelpCircle, X, Package, RefreshCw, MessageSquare, ChevronRight, CheckCircle2 } from 'lucide-react'

interface HelpStep {
  icon?: React.ReactNode
  title: string
  description: string
}

interface HelpSection {
  id: string
  icon: React.ReactNode
  title: string
  subtitle: string
  steps: HelpStep[]
  tips?: string[]
}

const helpContent: HelpSection[] = [
  {
    id: 'envio',
    icon: <Package className="w-5 h-5" />,
    title: 'Envio (Retirada)',
    subtitle: 'Cliente veio buscar o pedido',
    steps: [
      {
        title: 'Buscar pedido',
        description: 'Digite o número do pedido e clique em buscar'
      },
      {
        title: 'Conferir itens',
        description: 'Marque cada item como conferido antes de entregar'
      },
      {
        title: 'Dados do retirante',
        description: 'Preencha nome, CPF e selecione o responsável pela entrega'
      },
      {
        title: 'Foto',
        description: 'Tire uma foto do cliente com o pedido para registro'
      },
      {
        title: 'Confirmar',
        description: 'Clique em confirmar - pedido será marcado como "Retirado"'
      }
    ],
    tips: [
      'Confira sempre os itens antes de entregar',
      'A foto é obrigatória para finalizar',
      'O CPF deve ter 11 dígitos'
    ]
  },
  {
    id: 'reenvio',
    icon: <RefreshCw className="w-5 h-5" />,
    title: 'Reenvio',
    subtitle: 'Pedido retornou e cliente veio buscar novamente',
    steps: [
      {
        title: 'Acesse via Relatório',
        description: 'Encontre o pedido com status "Retornado" e clique em "Reenviar"'
      },
      {
        title: 'Dados carregados',
        description: 'O sistema preenche automaticamente os dados do pedido anterior'
      },
      {
        title: 'Novo rastreio (opcional)',
        description: 'Se houver nova transportadora, informe o novo código'
      },
      {
        title: 'Nova foto',
        description: 'Registre a nova entrega com uma foto atualizada'
      },
      {
        title: 'Confirmar',
        description: 'Ocorrências anteriores são encerradas automaticamente'
      }
    ],
    tips: [
      'O badge "Reenviado" aparece no histórico',
      'Todas as ocorrências abertas são fechadas ao confirmar',
      'O pedido mantém o histórico completo de tentativas'
    ]
  },
  {
    id: 'ocorrencias',
    icon: <MessageSquare className="w-5 h-5" />,
    title: 'Ocorrências',
    subtitle: 'Comunicação entre setores sobre problemas',
    steps: [
      {
        title: 'Quando usar',
        description: 'Cliente não veio buscar, produto com defeito, endereço incorreto, falta de documentação'
      },
      {
        title: 'Abrir ocorrência',
        description: 'No detalhe do pedido, clique em "Nova Ocorrência" e descreva o problema'
      },
      {
        title: 'Selecionar destinatário',
        description: 'Escolha o setor ou pessoa que precisa resolver o problema'
      },
      {
        title: 'Acompanhar',
        description: 'Você recebe notificações quando houver resposta'
      },
      {
        title: 'Resolver',
        description: 'Marque como resolvido ou aguarde o reenvio do pedido'
      }
    ],
    tips: [
      'Seja claro e objetivo na descrição do problema',
      'A ocorrência fica visível para todos os envolvidos',
      'Ao fazer reenvio, ocorrências são encerradas automaticamente'
    ]
  }
]

interface HelpDrawerProps {
  context?: 'retirada' | 'relatorios' | 'all'
}

export default function HelpDrawer({ context = 'all' }: HelpDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>(null)

  const filteredContent = context === 'all' 
    ? helpContent 
    : context === 'retirada'
      ? helpContent.filter(s => s.id === 'envio' || s.id === 'reenvio')
      : helpContent

  return (
    <>
      {/* Botão de Ajuda */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
        title="Central de Ajuda"
      >
        <HelpCircle className="w-5 h-5" />
        <span className="hidden sm:inline">Ajuda</span>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 bg-gradient-to-r from-amber-50 to-yellow-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <HelpCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="font-semibold text-zinc-900">Central de Ajuda</h2>
              <p className="text-xs text-zinc-500">Como usar o sistema</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100%-80px)] p-4">
          {/* Tabs de navegação */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {filteredContent.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeSection === section.id
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                {section.icon}
                {section.title}
              </button>
            ))}
          </div>

          {/* Seções */}
          <div className="space-y-4">
            {filteredContent.map((section) => (
              <div
                key={section.id}
                className={`border border-zinc-200 rounded-xl overflow-hidden transition-all ${
                  activeSection === section.id ? 'ring-2 ring-amber-200' : ''
                }`}
              >
                {/* Header da seção */}
                <button
                  onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      section.id === 'envio' ? 'bg-green-100 text-green-600' :
                      section.id === 'reenvio' ? 'bg-blue-100 text-blue-600' :
                      'bg-purple-100 text-purple-600'
                    }`}>
                      {section.icon}
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium text-zinc-900">{section.title}</h3>
                      <p className="text-xs text-zinc-500">{section.subtitle}</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-zinc-400 transition-transform ${
                    activeSection === section.id ? 'rotate-90' : ''
                  }`} />
                </button>

                {/* Conteúdo expandido */}
                {activeSection === section.id && (
                  <div className="px-4 pb-4 border-t border-zinc-100">
                    {/* Steps */}
                    <div className="mt-4 space-y-3">
                      {section.steps.map((step, index) => (
                        <div key={index} className="flex gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-medium text-zinc-800 text-sm">{step.title}</h4>
                            <p className="text-xs text-zinc-500 mt-0.5">{step.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Tips */}
                    {section.tips && section.tips.length > 0 && (
                      <div className="mt-4 p-3 bg-amber-50 rounded-lg">
                        <h4 className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Dicas
                        </h4>
                        <ul className="space-y-1">
                          {section.tips.map((tip, index) => (
                            <li key={index} className="text-xs text-amber-600 flex items-start gap-2">
                              <span className="text-amber-400">•</span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
