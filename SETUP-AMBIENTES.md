# 🚀 Setup de Ambientes - Estrutura Profissional

## 📋 Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                      PRODUÇÃO                                    │
│  URL: www.ecomlogic.com.br                                      │
│  Banco: expedicaoecompack (Supabase)                            │
│  Token Tiny: Oficial                                            │
│  Supabase Auth: Produção                                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    DESENVOLVIMENTO                               │
│  URL: dev.ecomlogic.com.br                                      │
│  Banco: tiny-expedicao-dev (Supabase)                           │
│  Token Tiny: Teste                                              │
│  Supabase Auth: Desenvolvimento                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🔧 Variáveis de Ambiente na Vercel

### **Obrigatórias para PRODUÇÃO:**

| Variável | Descrição | Ambiente |
|----------|-----------|----------|
| `DATABASE_URL` | URL do banco Supabase de PRODUÇÃO | Production |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do Supabase de PRODUÇÃO | Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon Key do Supabase de PRODUÇÃO | Production |

### **Obrigatórias para DESENVOLVIMENTO:**

| Variável | Descrição | Ambiente |
|----------|-----------|----------|
| `DATABASE_URL_DEV` | URL do banco Supabase de DESENVOLVIMENTO | Production |
| `NEXT_PUBLIC_SUPABASE_URL_DEV` | URL do Supabase de DESENVOLVIMENTO | Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY_DEV` | Anon Key do Supabase de DESENVOLVIMENTO | Production |
| `TINY_API_TOKEN_OVERRIDE` | Token de TESTE da Tiny | Production |

> **IMPORTANTE:** Todas as variáveis devem estar em "Production" na Vercel.
> O código detecta automaticamente qual usar baseado no domínio.

---

## 📝 Passo a Passo para Configurar

### 1. Criar variáveis na Vercel

Acesse: https://vercel.com/lojaecompack-hash/expedi-ao/settings/environment-variables

Adicione as variáveis:

```
DATABASE_URL = postgresql://postgres:[SENHA]@db.[ID_PROD].supabase.co:6543/postgres?pgbouncer=true
DATABASE_URL_DEV = postgresql://postgres:[SENHA]@db.[ID_DEV].supabase.co:6543/postgres?pgbouncer=true

NEXT_PUBLIC_SUPABASE_URL = https://[ID_PROD].supabase.co
NEXT_PUBLIC_SUPABASE_URL_DEV = https://[ID_DEV].supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY = [KEY_PROD]
NEXT_PUBLIC_SUPABASE_ANON_KEY_DEV = [KEY_DEV]

TINY_API_TOKEN_OVERRIDE = [TOKEN_TESTE_TINY]
```

### 2. Configurar domínio dev.ecomlogic.com.br

Acesse: https://vercel.com/lojaecompack-hash/expedi-ao/settings/domains

1. Adicione `dev.ecomlogic.com.br`
2. Selecione **Production** (não Preview!)
3. Salve

### 3. Criar usuário no Supabase de DESENVOLVIMENTO

Acesse: https://supabase.com/dashboard/project/[ID_DEV]/auth/users

1. Clique em "Add User"
2. Email: seu email de teste
3. Senha: sua senha de teste
4. Confirme

---

## 🔄 Fluxo de Trabalho

### Desenvolvimento:
```bash
# 1. Fazer mudanças no código
git checkout main
# ... editar código ...

# 2. Commit e push
git add -A
git commit -m "feat: nova funcionalidade"
git push origin main

# 3. Deploy automático (2-3 min)

# 4. Testar em dev.ecomlogic.com.br
#    (usa banco de dev + token de teste)
```

### Produção:
```bash
# Mesmo código, mesma branch
# Acesse www.ecomlogic.com.br
# (usa banco de prod + token oficial)
```

---

## ✅ Como funciona a detecção de ambiente

O arquivo `src/lib/env.ts` detecta automaticamente o domínio:

- Se `VERCEL_URL` contém `dev.ecomlogic.com.br` → usa variáveis `_DEV`
- Caso contrário → usa variáveis de produção

```typescript
// Exemplo de uso
import { IS_DEV, ENV } from './env'

if (IS_DEV) {
  // Ambiente de desenvolvimento
} else {
  // Ambiente de produção
}
```

---

## 🎯 URLs Importantes

| Recurso | URL |
|---------|-----|
| **Produção** | https://www.ecomlogic.com.br |
| **Desenvolvimento** | https://dev.ecomlogic.com.br |
| **Vercel Dashboard** | https://vercel.com/lojaecompack-hash/expedi-ao |
| **Supabase Produção** | https://supabase.com/dashboard/project/rlmjlholksjlnuevtcu |
| **Supabase Dev** | https://supabase.com/dashboard/project/tkwlbedfasvvtwnuvrej |

---

## ⚠️ Checklist de Configuração

- [ ] Variável `DATABASE_URL` configurada
- [ ] Variável `DATABASE_URL_DEV` configurada
- [ ] Variável `NEXT_PUBLIC_SUPABASE_URL` configurada
- [ ] Variável `NEXT_PUBLIC_SUPABASE_URL_DEV` configurada
- [ ] Variável `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurada
- [ ] Variável `NEXT_PUBLIC_SUPABASE_ANON_KEY_DEV` configurada
- [ ] Variável `TINY_API_TOKEN_OVERRIDE` configurada
- [ ] Domínio `dev.ecomlogic.com.br` adicionado como Production
- [ ] Usuário criado no Supabase Auth de desenvolvimento
- [ ] Tabelas criadas no banco de desenvolvimento (rodar SQL do schema)
