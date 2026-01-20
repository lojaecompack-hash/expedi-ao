# 🎯 Guia de Ambientes - Sistema de Expedição

## ✅ Configuração Completa

### **Ambientes Separados:**

| Ambiente | URL | Banco de Dados | Token Tiny | Branch Git |
|----------|-----|----------------|------------|------------|
| **Produção** | `www.ecomlogic.com.br` | `expedicaoecompack` (antigo) | Token oficial (do banco) | `main` |
| **Desenvolvimento** | `expedi-ao-git-dev.vercel.app` | `tiny-expedicao-dev` (novo) | Token de teste (variável) | `dev` |

---

## 🔧 Variáveis de Ambiente (Vercel)

### **Preview (Desenvolvimento):**
```
DATABASE_URL = postgresql://postgres:ecompack2026dev@db.tkwlbedfasvvtwnuvrej.supabase.co:6543/postgres?pgbouncer=true
TINY_API_TOKEN_OVERRIDE = [token de teste da Tiny]
```

### **Production (Produção):**
```
DATABASE_URL = postgresql://postgres:ecompack2026@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```
*(Não tem `TINY_API_TOKEN_OVERRIDE` - usa token do banco)*

---

## 🔄 Fluxo de Trabalho

### **1. Desenvolver nova funcionalidade:**
```bash
git checkout dev
# ... faça suas alterações ...
git add -A
git commit -m "feat: nova funcionalidade"
git push origin dev
```
- Deploy automático em `expedi-ao-git-dev.vercel.app`
- Usa banco de TESTE
- Usa token de TESTE da Tiny

### **2. Testar no ambiente de desenvolvimento:**
- Acesse `expedi-ao-git-dev.vercel.app`
- Teste à vontade
- Dados não afetam produção

### **3. Quando estiver pronto para produção:**
```bash
git checkout main
git merge dev
git push origin main
```
- Deploy automático em `www.ecomlogic.com.br`
- Usa banco de PRODUÇÃO
- Usa token OFICIAL da Tiny

---

## 📊 Como o Sistema Decide Qual Token Usar

```javascript
// src/lib/tiny-api.ts
export async function getTinyApiToken(): Promise<string> {
  // 1. PRIMEIRO: Verifica variável de ambiente
  const envToken = process.env.TINY_API_TOKEN_OVERRIDE
  if (envToken) {
    console.log('[Tiny API] Usando token de VARIÁVEL DE AMBIENTE (preview/dev)')
    return envToken
  }

  // 2. SE NÃO: Usa token do banco de dados
  console.log('[Tiny API] Usando token do BANCO DE DADOS (produção)')
  return decrypt(workspace.tinySettings.apiTokenEncrypted)
}
```

---

## 🗄️ Bancos de Dados

### **Produção (`expedicaoecompack`):**
- Dados reais dos clientes
- Configurações da Tiny com token oficial
- **NUNCA limpar!**

### **Desenvolvimento (`tiny-expedicao-dev`):**
- Dados de teste
- Pode limpar/resetar à vontade
- Precisa executar migrations após criar

---

## 🚀 Próximos Passos (Primeira Vez)

### **1. Executar migrations no banco de desenvolvimento:**

Acesse Supabase → `tiny-expedicao-dev` → SQL Editor e execute:

```sql
-- Copie o schema do Prisma ou execute as migrations existentes
```

### **2. Configurar token oficial no banco de produção:**

Acesse `www.ecomlogic.com.br/settings/integrations/tiny` e configure o token oficial.

### **3. Fazer primeiro teste:**

```bash
git checkout dev
git add -A
git commit -m "test: Primeiro teste de ambiente"
git push origin dev
```

Aguarde deploy e acesse `expedi-ao-git-dev.vercel.app`

---

## ✅ Verificação de Logs

### **Produção:**
Vercel → Projeto → Deployments → Production → Runtime Logs
```
[Tiny API] Usando token do BANCO DE DADOS (produção)
```

### **Desenvolvimento:**
Vercel → Projeto → Deployments → Preview → Runtime Logs
```
[Tiny API] Usando token de VARIÁVEL DE AMBIENTE (preview/dev)
```

---

## 🔐 Senhas

- **Banco de produção:** `ecompack2026`
- **Banco de desenvolvimento:** `ecompack2026dev`

---

**Data de configuração:** 2026-01-20
