# Debug: Por que o menu mostra "Expedição" ao invés de "ADMIN"?

## ✅ Confirmado:
- Banco de PRODUÇÃO: role = ADMIN ✓
- Usuário: lojaecompack@gmail.com ✓
- isActive: true ✓

## ❌ Problema:
- Menu mostra "Usuário: Expedição" ao invés de "Administrador"

## 🔍 Possíveis causas:

### 1. API /api/user-role retornando valor errado
- Verificar logs do Vercel
- Testar API diretamente: https://www.ecomlogic.com.br/api/user-role

### 2. MainLayout usando valor em cache
- LocalStorage
- SessionStorage
- State do React

### 3. Lógica de exibição do menu incorreta
- Verificar código do MainLayout
- Verificar mapeamento de roles

## 🧪 Teste direto da API:

Abra o console do navegador (F12) e execute:

```javascript
fetch('/api/user-role')
  .then(r => r.json())
  .then(data => console.log('API Response:', data))
```

Me envie o resultado que aparece no console.
