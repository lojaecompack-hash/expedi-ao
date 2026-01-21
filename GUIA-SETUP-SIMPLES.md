# 🚀 Guia de Setup - Arquitetura Simplificada

## 📋 Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    DESENVOLVIMENTO                           │
│  Onde: localhost:3000 (npm run dev)                         │
│  Banco: tiny-expedicao-dev (Supabase)                       │
│  Token Tiny: Teste                                          │
│  Supabase Auth: Desenvolvimento                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      PRODUÇÃO                                │
│  Onde: www.ecomlogic.com.br (Vercel)                        │
│  Banco: expedicaoecompack (Supabase)                        │
│  Token Tiny: Oficial                                        │
│  Supabase Auth: Produção                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Setup Desenvolvimento Local

### 1. Criar arquivo `.env.local`

Copie `env.local.example` para `.env.local`:

```bash
cp env.local.example .env.local
```

### 2. Preencher variáveis de desenvolvimento

Edite `.env.local` com as credenciais do Supabase **tiny-expedicao-dev**:

```env
DATABASE_URL="postgresql://postgres:[SENHA]@db.tkwlbedfasvvtwnuvrej.supabase.co:6543/postgres?pgbouncer=true"
NEXT_PUBLIC_SUPABASE_URL="https://tkwlbedfasvvtwnuvrej.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[SUA_ANON_KEY_DEV]"
TINY_API_TOKEN_OVERRIDE="[SEU_TOKEN_DE_TESTE]"
```

### 3. Rodar localmente

```bash
npm run dev
```

Acesse: `http://localhost:3000`

---

## ☁️ Setup Produção (Vercel)

### 1. Variáveis de ambiente na Vercel

Acesse: https://vercel.com/lojaecompack-hash/expedi-ao/settings/environment-variables

Configure **apenas em Production**:

| Variável | Valor | Ambiente |
|----------|-------|----------|
| `DATABASE_URL` | URL do `expedicaoecompack` | Production |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://rlmjrholbksljnuevtcu.supabase.co` | Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon Key de produção | Production |
| `TINY_OAUTH_PROXY_URL` | `https://tiny-oauth-proxy.vercel.app` | Production |
| `APP_ENCRYPTION_KEY` | Sua chave de criptografia | Production |
| `BOOTSTRAP_ADMIN_EMAIL` | `lojaecompack@gmail.com` | Production |

### 2. Remover domínio dev.ecomlogic.com.br

Acesse: https://vercel.com/lojaecompack-hash/expedi-ao/settings/domains

- Remova `dev.ecomlogic.com.br` se existir
- Mantenha apenas `www.ecomlogic.com.br`

---

## 🎯 Fluxo de Trabalho

### Desenvolvimento:
```bash
# 1. Editar código localmente
npm run dev

# 2. Testar em localhost:3000
# (usa banco de dev + token de teste)

# 3. Commit e push
git add -A
git commit -m "feat: nova funcionalidade"
git push origin main
```

### Produção:
```bash
# Deploy automático na Vercel
# Acesse: www.ecomlogic.com.br
# (usa banco de prod + token oficial)
```

---

## ✅ Checklist

- [ ] Arquivo `.env.local` criado com variáveis de dev
- [ ] Variáveis de produção configuradas na Vercel
- [ ] Domínio `dev.ecomlogic.com.br` removido da Vercel
- [ ] Usuário criado no Supabase de desenvolvimento
- [ ] Usuário criado no Supabase de produção
- [ ] Teste local funcionando (`localhost:3000`)
- [ ] Teste produção funcionando (`www.ecomlogic.com.br`)

---

## 🔑 Usuários

### Desenvolvimento (localhost):
- Email: `lojaecompack@gmail.com`
- Senha: (configurada no Supabase dev)
- Criar em: https://supabase.com/dashboard/project/tkwlbedfasvvtwnuvrej/auth/users

### Produção (www.ecomlogic.com.br):
- Email: `lojaecompack@gmail.com`
- Senha: (configurada no Supabase prod)
- Criar em: https://supabase.com/dashboard/project/rlmjrholbksljnuevtcu/auth/users

---

## 📝 Observações

- **Não use Preview deployments** - apenas Production
- **Desenvolvimento = localhost** - não precisa de domínio
- **Produção = www.ecomlogic.com.br** - único domínio público
- **Bancos separados** - dev e prod nunca se misturam
