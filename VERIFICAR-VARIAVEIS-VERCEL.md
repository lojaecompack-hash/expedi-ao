# Verificar e Configurar Variáveis de Ambiente no Vercel

## 🔴 PROBLEMA:
A página `/usuarios` funciona em localhost mas dá erro em produção (www.ecomlogic.com.br)

## 🔍 CAUSA PROVÁVEL:
As variáveis de ambiente no Vercel podem estar incorretas ou faltando.

---

## ✅ SOLUÇÃO:

### 1. Acesse as configurações do projeto no Vercel:
https://vercel.com/lojaecompack-hashs-projects/tiny-expedicao/settings/environment-variables

### 2. Verifique se estas variáveis existem para PRODUCTION:

#### **DATABASE_URL** (OBRIGATÓRIO)
```
postgresql://postgres.rlmjrholbksljnuevtcu:[SENHA]@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
```
- Substitua `[SENHA]` pela senha do banco de PRODUÇÃO
- Use o **pooler** (porta 5432 ou 6543)

#### **NEXT_PUBLIC_SUPABASE_URL** (OBRIGATÓRIO)
```
https://rlmjrholbksljnuevtcu.supabase.co
```

#### **NEXT_PUBLIC_SUPABASE_ANON_KEY** (OBRIGATÓRIO)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsbWpyaG9sYmtzbGpudWV2dGN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5NTI4NzIsImV4cCI6MjA1MjUyODg3Mn0.VrfQYFXxKfNJGQ-7sBQvYYnDqrpGxBpqKjBNYPGdXWI
```

#### **TINY_API_TOKEN_OVERRIDE** (Opcional)
```
429599f5e4eae058ca9e29b4065946aeccd4d71cd63fe82ddc01fc2df8156987
```

#### **TINY_OAUTH_PROXY_URL**
```
https://tiny-oauth-proxy.vercel.app
```

#### **APP_ENCRYPTION_KEY**
```
12345678901234567890123456789012
```

#### **BOOTSTRAP_ADMIN_EMAIL**
```
lojaecompack@gmail.com
```

---

### 3. Depois de configurar, faça um novo deploy:
- Vá em: https://vercel.com/lojaecompack-hashs-projects/tiny-expedicao
- Clique em "Deployments"
- Clique em "Redeploy" no último deployment

---

## 📋 IMPORTANTE:
- As variáveis devem estar configuradas para o ambiente **Production**
- Depois de alterar variáveis, é necessário fazer um novo deploy
- A `DATABASE_URL` deve apontar para o banco de PRODUÇÃO (rlmjrholbksljnuevtcu)
