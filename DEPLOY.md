# 🚀 Guia de Deploy - Tiny Expedição

Este guia detalha o processo completo de deploy do sistema na Vercel com integração GitHub.

## 📋 Checklist Pré-Deploy

Antes de fazer o deploy, certifique-se de que:

- [ ] Todas as migrations SQL foram aplicadas no Supabase
- [ ] As variáveis de ambiente estão documentadas no `.env.example`
- [ ] O código está no GitHub
- [ ] Você tem acesso ao projeto Supabase
- [ ] Você tem credenciais OAuth do Tiny ERP

## 🔧 Passo 1: Preparar o Supabase

### 1.1 Aplicar Migrations

Acesse o Supabase SQL Editor e execute as migrations na ordem:

```sql
-- 1. RBAC Models (Workspace, Membership)
-- Copie e execute: prisma/migrations/20260113160000_rbac/migration.sql

-- 2. Tiny Settings
-- Copie e execute: prisma/migrations/20260113180000_tiny_settings/migration.sql
```

### 1.2 Obter Credenciais

Anote as seguintes informações do Supabase:

1. **API Settings** (https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. **Database Settings** (https://supabase.com/dashboard/project/YOUR_PROJECT/settings/database):
   - Connection String (URI) - porta 5432
   - Senha do banco (você definiu ao criar o projeto)

## 🔧 Passo 2: Preparar Variáveis de Ambiente

### 2.1 Gerar APP_ENCRYPTION_KEY

Execute localmente:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copie a chave gerada (64 caracteres).

### 2.2 Preparar DATABASE_URL

Formato:
```
postgresql://postgres:SENHA@db.SEU-PROJETO.supabase.co:5432/postgres
```

**IMPORTANTE:** Se sua senha contém `@`, substitua por `%40`:
- Senha: `@Bruno0154` → URL: `%40Bruno0154`

Exemplo completo:
```
postgresql://postgres:%40Bruno0154@db.rlmjrholbksljnuevtcu.supabase.co:5432/postgres
```

## 🚀 Passo 3: Deploy na Vercel

### 3.1 Conectar GitHub

1. Acesse [vercel.com](https://vercel.com)
2. Faça login com GitHub
3. Clique em "Add New..." → "Project"
4. Selecione o repositório `tiny-expedicao`
5. Clique em "Import"

### 3.2 Configurar Projeto

Na tela de configuração:

1. **Framework Preset:** Next.js (detectado automaticamente)
2. **Root Directory:** `./` (deixe padrão)
3. **Build Command:** `npm run vercel-build` (ou deixe padrão)
4. **Output Directory:** `.next` (deixe padrão)

### 3.3 Adicionar Environment Variables

Clique em "Environment Variables" e adicione:

| Name | Value | Environment |
|------|-------|-------------|
| `DATABASE_URL` | `postgresql://postgres:...` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://seu-projeto.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGc...` | Production, Preview, Development |
| `TINY_CLIENT_ID` | Seu Client ID | Production, Preview, Development |
| `TINY_CLIENT_SECRET` | Seu Client Secret | Production, Preview, Development |
| `APP_ENCRYPTION_KEY` | Chave gerada (64 chars) | Production, Preview, Development |
| `BOOTSTRAP_ADMIN_EMAIL` | `seu-email@example.com` | Production, Preview, Development |

**Dica:** Marque "Production, Preview, Development" para todas as variáveis.

### 3.4 Deploy

1. Clique em "Deploy"
2. Aguarde o build (2-3 minutos)
3. Acesse a URL gerada (ex: `tiny-expedicao.vercel.app`)

## ✅ Passo 4: Verificar Deploy

### 4.1 Testar Autenticação

1. Acesse `https://seu-app.vercel.app/login`
2. Faça login com email/senha do Supabase
3. Deve redirecionar para `/dashboard`

### 4.2 Testar RBAC

1. Verifique se o email do `BOOTSTRAP_ADMIN_EMAIL` tem acesso a Settings
2. Acesse `/settings/integrations/tiny`
3. Deve carregar sem erros

### 4.3 Verificar Logs

Na Vercel:
1. Vá em "Deployments" → Clique no último deploy
2. Vá em "Functions" → Veja os logs das API routes
3. Procure por erros de conexão ao banco

## 🔄 Passo 5: Configurar Deploy Automático

### 5.1 GitHub Actions (Opcional)

O arquivo `.github/workflows/ci.yml` já está configurado para:
- Rodar lint em cada push
- Fazer build de teste
- Validar que o código compila

Para ativar:
1. Vá em Settings → Secrets and variables → Actions
2. Adicione as mesmas variáveis de ambiente da Vercel
3. Cada push/PR rodará os testes automaticamente

### 5.2 Deploy em Branches

Por padrão, a Vercel faz:
- **Push para `main`** → Deploy em produção
- **Pull Request** → Preview deployment (URL temporária)

Para configurar branches adicionais:
1. Na Vercel, vá em Settings → Git
2. Configure "Production Branch" = `main`
3. Habilite "Automatic Deployments" para PRs

## 🐛 Troubleshooting

### Build falha com erro de Prisma

**Erro:** `Prisma Client not generated`

**Solução:**
1. Verifique se `DATABASE_URL` está configurada
2. Confirme que o script `vercel-build` está no `package.json`
3. Redeploye manualmente

### Erro de conexão ao banco em produção

**Erro:** `Can't reach database server`

**Solução:**
1. Verifique se a `DATABASE_URL` está correta
2. Confirme que a senha está URL-encoded
3. Teste a conexão no Supabase SQL Editor
4. Verifique se o projeto Supabase está ativo (não pausado)

### Settings não salvam (versão simplificada)

**Causa:** O código está usando `/api/settings/tiny-simple` (memória)

**Solução:**
1. Edite `src/app/settings/integrations/tiny/page.tsx`
2. Mude `/api/settings/tiny-simple` para `/api/settings/tiny`
3. Commit e push
4. Aguarde redeploy automático

### Variáveis de ambiente não atualizadas

**Solução:**
1. Vá em Settings → Environment Variables na Vercel
2. Edite a variável
3. Vá em Deployments → Redeploy (botão "...")

## 📊 Monitoramento

### Logs em Tempo Real

```bash
vercel logs https://seu-app.vercel.app --follow
```

### Analytics

A Vercel fornece analytics gratuitos:
- Acesse "Analytics" no dashboard
- Veja pageviews, performance, erros

### Supabase Logs

Monitore queries no Supabase:
1. Dashboard → Logs
2. Filtre por API/Database
3. Veja queries lentas

## 🔐 Segurança em Produção

### Checklist de Segurança

- [ ] Todas as secrets estão em variáveis de ambiente (não hardcoded)
- [ ] `APP_ENCRYPTION_KEY` é única e segura (64 chars hex)
- [ ] Supabase RLS (Row Level Security) está habilitado
- [ ] CORS configurado corretamente
- [ ] Rate limiting habilitado (Vercel Pro)

### Rotação de Secrets

Para rotacionar secrets:
1. Gere nova chave: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
2. Atualize `APP_ENCRYPTION_KEY` na Vercel
3. Redeploy
4. **IMPORTANTE:** Dados criptografados com a chave antiga não poderão ser descriptografados

## 🎯 Próximos Passos

Após deploy bem-sucedido:

1. **Custom Domain:**
   - Vercel Settings → Domains
   - Adicione seu domínio
   - Configure DNS

2. **Monitoramento:**
   - Configure Sentry para error tracking
   - Configure Vercel Analytics

3. **Performance:**
   - Habilite Vercel Edge Functions
   - Configure ISR (Incremental Static Regeneration)

4. **Backup:**
   - Configure backups automáticos no Supabase
   - Exporte dados regularmente

## 📞 Suporte

- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs

---

✅ **Deploy concluído!** Seu sistema está rodando em produção.
