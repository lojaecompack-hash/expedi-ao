# 🚀 Guia de Ambientes - Sistema de Expedição

## ✅ **Configuração Atual (FUNCIONANDO)**

### **Produção:**
- **URL:** `www.ecomlogic.com.br`
- **URL alternativa:** `expedi-ao.vercel.app`
- **Branch Git:** `main`
- **Banco de dados:** `expedicaoecompack` (Supabase)
- **Token Tiny:** Oficial (do banco de dados)
- **Status:** ✅ Funcionando perfeitamente

---

## 🔄 **Fluxo de Trabalho Recomendado**

### **1. Fazer mudanças no código:**
```bash
# Trabalhe na branch main
git checkout main

# Faça suas alterações
# ... edite os arquivos ...

# Commit
git add -A
git commit -m "feat: descrição da mudança"
```

### **2. Testar localmente (OPCIONAL):**
```bash
npm run dev
# Acesse http://localhost:3000
```

### **3. Deploy para produção:**
```bash
git push origin main
```
- Deploy automático em 2-3 minutos
- Acesse `www.ecomlogic.com.br` para verificar

---

## ⚠️ **Importante:**

### **Não há ambiente de desenvolvimento separado funcionando**
As URLs de preview da Vercel estão com problemas técnicos.

### **Recomendação:**
- Faça mudanças pequenas e incrementais
- Teste bem antes de fazer push
- Se possível, teste localmente com `npm run dev`
- Faça deploy em horários de baixo uso

---

## 📱 **Funcionalidades Ativas:**

✅ **PWA instalável** (pode instalar como app)  
✅ **Layout responsivo** (funciona em mobile e desktop)  
✅ **Menu hamburger** no mobile  
✅ **Botão de câmera** 📷 para tirar fotos  
✅ **Service Worker** para cache offline  

---

## 🔐 **Login de Produção:**

**Email:** `lojaecompack@gmail.com`  
**Senha:** (sua senha configurada no Supabase)

---

## 📊 **Variáveis de Ambiente (Vercel):**

Todas configuradas para produção:
- `DATABASE_URL` → Banco de produção
- `NEXT_PUBLIC_SUPABASE_URL` → Supabase produção
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Key de produção

---

## 🎯 **URLs Importantes:**

| Recurso | URL |
|---------|-----|
| **Site principal** | https://www.ecomlogic.com.br |
| **Vercel Dashboard** | https://vercel.com/lojaecompack-hash/expedi-ao |
| **Supabase Dashboard** | https://supabase.com/dashboard/project/rlmjlholksjlnuevtcu |
| **GitHub Repo** | https://github.com/lojaecompack-hash/expedi-ao |

---

## 📝 **Resumo:**

**Ambiente único de produção funcionando perfeitamente.**

Para fazer mudanças:
1. Edite o código
2. Commit e push para `main`
3. Aguarde deploy automático
4. Teste em `www.ecomlogic.com.br`

**Simples e direto!** 🚀
