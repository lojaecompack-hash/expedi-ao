# Testar Conexão do Prisma com Banco de Produção

## 🔴 PROBLEMA IDENTIFICADO:
A API `/api/user-role` retorna erro 500 porque o Prisma não consegue conectar ao banco de dados.

## ✅ SOLUÇÃO:

### 1. Obter a Connection String CORRETA do Supabase

Acesse: https://supabase.com/dashboard/project/rlmjrholbksljnuevtcu/settings/database

Na seção **"Connection string"**:
- Selecione **"Session pooler"** (porta 5432) - NÃO use Transaction pooler
- Clique em **"URI"**
- Copie a URL completa

**Formato esperado:**
```
postgresql://postgres.rlmjrholbksljnuevtcu:[SENHA]@aws-1-us-east-1.pooler.supabase.com:5432/postgres
```

### 2. Atualizar no Vercel

Acesse: https://vercel.com/lojaecompack-hashs-projects/tiny-expedicao/settings/environment-variables

**Edite a variável `DATABASE_URL`:**
- Cole a nova connection string (com porta 5432)
- Certifique-se que está marcada para **Production**
- Clique em **Save**

### 3. Fazer Redeploy

Acesse: https://vercel.com/lojaecompack-hashs-projects/tiny-expedicao/deployments

- Clique nos 3 pontos do último deployment
- Clique em **"Redeploy"**
- Aguarde 1-2 minutos

### 4. Testar novamente

Após o deploy:
- Acesse: https://www.ecomlogic.com.br
- Faça logout e login
- Verifique se o menu mostra "Administrador"

---

## 📋 IMPORTANTE:

**Use porta 5432 (Session pooler) ao invés de 6543 (Transaction pooler)**

O Prisma funciona melhor com Session pooler em produção.
