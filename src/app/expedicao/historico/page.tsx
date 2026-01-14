import AppLayout from '@/components/AppLayout'

export default function HistoricoPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Histórico de Retiradas</h1>
          <p className="mt-2 text-gray-600">
            Visualize todas as retiradas registradas no sistema
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">📋</span>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhuma retirada registrada
            </h3>
            <p className="text-gray-600 mb-6">
              As retiradas aparecerão aqui após serem registradas
            </p>
            <a
              href="/expedicao/retirada"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              <span>📦</span>
              Registrar Primeira Retirada
            </a>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
