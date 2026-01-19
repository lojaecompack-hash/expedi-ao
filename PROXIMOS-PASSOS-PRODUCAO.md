# 📋 PRÓXIMOS PASSOS - MÓDULO DE PRODUÇÃO

## ✅ JÁ IMPLEMENTADO:

1. ✅ **Schema Prisma atualizado**
   - Modelo `ProductionBobina` criado
   - `ProductionOrder` atualizado (peso e quantidade opcionais)

2. ✅ **SQL de migração executado**
   - Tabela `ProductionBobina` criada
   - Campos antigos removidos
   - Campos opcionais configurados

3. ✅ **APIs atualizadas**
   - `/api/production/orders` - Criar OP com bobina inicial
   - `/api/production/orders/[id]/trocar-bobina` - Trocar bobina
   - `/api/production/orders/[id]` - Finalizar com peso/quantidade

---

## 🔧 FALTA IMPLEMENTAR NAS TELAS:

### **1. Tela `/producao/op/[id]/page.tsx`**

#### **A. Atualizar cálculo do balanço de massa:**

```tsx
// ANTES (linha 236-237):
const pesoRestante = Number(order.bobinaPesoInicial) - Number(order.pesoTotalProduzido) - Number(order.totalApara)
const progresso = Math.min(100, Math.round(((Number(order.pesoTotalProduzido) + Number(order.totalApara)) / Number(order.bobinaPesoInicial)) * 100))

// DEPOIS:
const totalBobinas = order.bobinas.reduce((acc, b) => acc + Number(b.pesoInicial), 0)
const pesoRestante = order.bobinas.find(b => !b.fimAt)?.pesoInicial || 0
const pesoUsado = Number(order.pesoTotalProduzido || 0) + Number(order.totalApara)
const progresso = totalBobinas > 0 ? Math.min(100, Math.round((pesoUsado / totalBobinas) * 100)) : 0
```

#### **B. Adicionar seção "Bobinas Utilizadas" (após linha 290):**

```tsx
{/* Bobinas Utilizadas */}
<div className="bg-white rounded-xl border border-zinc-200 p-6">
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-lg font-semibold text-zinc-900">🎞️ Bobinas Utilizadas</h2>
    <button
      onClick={() => setShowTrocarBobinaModal(true)}
      className="px-4 py-2 bg-[#FFD700] hover:bg-[#E6C200] rounded-lg text-sm font-medium transition-colors"
    >
      ➕ Trocar Bobina
    </button>
  </div>
  
  <div className="space-y-2">
    {order.bobinas.map((bobina) => (
      <div key={bobina.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
        <div className="flex items-center gap-4">
          <span className="font-bold text-zinc-900">#{bobina.sequencia}</span>
          <span className="text-zinc-600">{bobina.bobinaSku}</span>
          <span className="text-sm text-zinc-500">
            {Number(bobina.pesoInicial).toFixed(1)}kg
            {bobina.pesoRestante !== null && ` → ${Number(bobina.pesoRestante).toFixed(1)}kg`}
          </span>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          bobina.fimAt 
            ? 'bg-zinc-200 text-zinc-600' 
            : 'bg-green-100 text-green-700'
        }`}>
          {bobina.fimAt ? '✅ Finalizada' : '🟢 Em Uso'}
        </span>
      </div>
    ))}
  </div>
  
  <div className="mt-4 pt-4 border-t border-zinc-200">
    <div className="flex justify-between text-sm">
      <span className="text-zinc-500">Total de bobinas:</span>
      <span className="font-bold">{order.bobinas.length}</span>
    </div>
    <div className="flex justify-between text-sm">
      <span className="text-zinc-500">Peso total:</span>
      <span className="font-bold">{totalBobinas.toFixed(1)} kg</span>
    </div>
  </div>
</div>
```

#### **C. Remover seção "Peso Total Produzido" (linhas 320-335)**

Essa seção deve ser removida pois o peso só é lançado no final.

#### **D. Atualizar modal "Finalizar OP" (linha 540+):**

```tsx
{/* Modal Finalizar - ATUALIZADO */}
{showFinalizarModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl p-6 w-full max-w-md">
      <h3 className="text-lg font-bold text-zinc-900 mb-4">Finalizar Ordem de Produção</h3>
      
      <div className="space-y-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Peso Total Produzido (kg) *
          </label>
          <input
            type="number"
            step="0.1"
            value={finalizarForm.peso}
            onChange={(e) => setFinalizarForm({ ...finalizarForm, peso: e.target.value })}
            placeholder="Ex: 2000.0"
            className="w-full px-4 py-2 border border-zinc-300 rounded-lg"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Quantidade de Pacotes *
          </label>
          <input
            type="number"
            value={finalizarForm.pacotes}
            onChange={(e) => setFinalizarForm({ ...finalizarForm, pacotes: e.target.value })}
            placeholder="Ex: 100"
            className="w-full px-4 py-2 border border-zinc-300 rounded-lg"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Quantidade de Unidades *
          </label>
          <input
            type="number"
            value={finalizarForm.unidades}
            onChange={(e) => setFinalizarForm({ ...finalizarForm, unidades: e.target.value })}
            placeholder="Ex: 100000"
            className="w-full px-4 py-2 border border-zinc-300 rounded-lg"
            required
          />
        </div>
      </div>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
        <p className="text-yellow-800 text-sm">
          ⚠️ Após finalizar, a ordem será enviada para conferência.
        </p>
      </div>
      
      <div className="flex gap-4">
        <button
          onClick={() => setShowFinalizarModal(false)}
          className="flex-1 px-4 py-3 bg-zinc-100 hover:bg-zinc-200 rounded-lg font-medium"
        >
          Cancelar
        </button>
        <button
          onClick={handleFinalizar}
          className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium"
        >
          Confirmar
        </button>
      </div>
    </div>
  </div>
)}
```

#### **E. Adicionar modal "Trocar Bobina":**

```tsx
{/* Modal Trocar Bobina - NOVO */}
{showTrocarBobinaModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl p-6 w-full max-w-md">
      <h3 className="text-lg font-bold text-zinc-900 mb-4">🔄 Trocar Bobina</h3>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <p className="text-blue-800 text-sm">
          Bobina Atual: {order.bobinas.find(b => !b.fimAt)?.bobinaSku || '-'}
        </p>
      </div>
      
      <div className="space-y-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Peso Restante da Bobina Atual (kg)
          </label>
          <input
            type="number"
            step="0.1"
            value={trocarBobinaForm.pesoRestante}
            onChange={(e) => setTrocarBobinaForm({ ...trocarBobinaForm, pesoRestante: e.target.value })}
            placeholder="Ex: 5.0"
            className="w-full px-4 py-2 border border-zinc-300 rounded-lg"
          />
        </div>
        
        <div className="border-t border-zinc-200 pt-4">
          <h4 className="font-medium text-zinc-900 mb-3">Nova Bobina:</h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                SKU da Nova Bobina *
              </label>
              <input
                type="text"
                value={trocarBobinaForm.novaBobinaSku}
                onChange={(e) => setTrocarBobinaForm({ ...trocarBobinaForm, novaBobinaSku: e.target.value })}
                placeholder="Digite o SKU"
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Peso Inicial (kg) *
              </label>
              <input
                type="number"
                step="0.1"
                value={trocarBobinaForm.novaBobinaPeso}
                onChange={(e) => setTrocarBobinaForm({ ...trocarBobinaForm, novaBobinaPeso: e.target.value })}
                placeholder="Ex: 100"
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Origem
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="origem"
                    value="EXTRUSORA"
                    checked={trocarBobinaForm.novaBobinaOrigem === 'EXTRUSORA'}
                    onChange={(e) => setTrocarBobinaForm({ ...trocarBobinaForm, novaBobinaOrigem: e.target.value })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Extrusora</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="origem"
                    value="TERCEIRO"
                    checked={trocarBobinaForm.novaBobinaOrigem === 'TERCEIRO'}
                    onChange={(e) => setTrocarBobinaForm({ ...trocarBobinaForm, novaBobinaOrigem: e.target.value })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Terceiro</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex gap-4">
        <button
          onClick={() => setShowTrocarBobinaModal(false)}
          className="flex-1 px-4 py-3 bg-zinc-100 hover:bg-zinc-200 rounded-lg font-medium"
        >
          Cancelar
        </button>
        <button
          onClick={handleTrocarBobina}
          className="flex-1 px-4 py-3 bg-[#FFD700] hover:bg-[#E6C200] rounded-lg font-medium"
        >
          ✅ Trocar e Continuar
        </button>
      </div>
    </div>
  </div>
)}
```

#### **F. Adicionar estados e funções:**

```tsx
// Adicionar após linha 74:
const [showTrocarBobinaModal, setShowTrocarBobinaModal] = useState(false)

// Adicionar após linha 79:
const [finalizarForm, setFinalizarForm] = useState({ peso: '', pacotes: '', unidades: '' })
const [trocarBobinaForm, setTrocarBobinaForm] = useState({
  pesoRestante: '',
  novaBobinaSku: '',
  novaBobinaPeso: '',
  novaBobinaOrigem: 'EXTRUSORA'
})

// Adicionar função handleTrocarBobina:
const handleTrocarBobina = async () => {
  if (!trocarBobinaForm.novaBobinaSku || !trocarBobinaForm.novaBobinaPeso) {
    alert('Preencha todos os campos obrigatórios')
    return
  }
  
  try {
    const res = await fetch(`/api/production/orders/${id}/trocar-bobina`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pesoRestante: parseFloat(trocarBobinaForm.pesoRestante) || 0,
        novaBobinaSku: trocarBobinaForm.novaBobinaSku,
        novaBobinaPeso: parseFloat(trocarBobinaForm.novaBobinaPeso),
        novaBobinaOrigem: trocarBobinaForm.novaBobinaOrigem
      })
    })
    
    const data = await res.json()
    if (data.ok) {
      alert('Bobina trocada com sucesso!')
      setShowTrocarBobinaModal(false)
      setTrocarBobinaForm({
        pesoRestante: '',
        novaBobinaSku: '',
        novaBobinaPeso: '',
        novaBobinaOrigem: 'EXTRUSORA'
      })
      fetchOrder()
    } else {
      alert(data.error)
    }
  } catch (error) {
    console.error('Erro ao trocar bobina:', error)
    alert('Erro ao trocar bobina')
  }
}

// Atualizar função handleFinalizar (linha 170+):
const handleFinalizar = async () => {
  if (!finalizarForm.peso || !finalizarForm.pacotes || !finalizarForm.unidades) {
    alert('Preencha todos os campos obrigatórios')
    return
  }
  
  try {
    const res = await fetch(`/api/production/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'FINALIZAR',
        pesoTotalProduzido: parseFloat(finalizarForm.peso),
        totalPacotes: parseInt(finalizarForm.pacotes),
        totalUnidades: parseInt(finalizarForm.unidades)
      })
    })
    const data = await res.json()
    if (data.ok) {
      alert('Ordem finalizada! Aguardando conferência.')
      router.push('/producao')
    } else {
      alert(data.error)
    }
  } catch (error) {
    console.error('Erro ao finalizar:', error)
  }
}
```

---

## 🧪 TESTAR APÓS IMPLEMENTAÇÃO:

1. **Criar nova OP** com bobina inicial
2. **Lançar aparas** durante produção
3. **Trocar bobina** (mesma medida)
4. **Finalizar OP** lançando peso + quantidade
5. **Conferir** na tela de conferência

---

## 📝 OBSERVAÇÕES:

- Peso e quantidade são **independentes**
- Peso é lançado **no final** da produção
- Quantidade é lançada **no final** da produção
- Bobinas podem ser trocadas **durante** a produção (mesma medida)
- Mudança de medida = **nova OP**
