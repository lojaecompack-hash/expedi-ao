# 🚀 Fluxo de Trabalho - Desenvolvimento e Produção

## 📋 DESENVOLVIMENTO LOCAL (sem afetar produção)

### 1. Iniciar servidor local
```bash
npm run dev
```
Acesse: http://localhost:3000

### 2. Fazer alterações no código
- Edite os arquivos
- Teste no navegador (localhost:3000)
- Faça quantos testes quiser

### 3. Salvar alterações localmente
```bash
git add .
git commit -m "descrição das mudanças"
```

**✅ IMPORTANTE:** NÃO faça `git push` ainda!  
Suas mudanças estão salvas localmente, mas a produção não é afetada.

---

## 🌐 DEPLOY PARA PRODUÇÃO (quando estiver pronto)

### 1. Revisar suas mudanças
```bash
git log --oneline -5  # Ver últimos 5 commits
```

### 2. Fazer push para produção
```bash
git push origin main
```

### 3. Aguardar deploy automático
- Vercel detecta o push automaticamente
- Faz build (1-2 minutos)
- Publica em www.ecomlogic.com.br

### 4. Verificar deploy
Acesse: https://vercel.com/lojaecompack-hashs-projects/tiny-expedicao/deployments

---

## ⚠️ LEMBRETE IMPORTANTE

**BANCO DE DADOS:** Como você está usando o mesmo banco (DEV) em ambos os ambientes:

- **Código:** Isolado ✅ (local ≠ produção até fazer push)
- **Dados:** Compartilhado ⚠️ (usuários, pedidos, etc.)

**Dica:** Use prefixos "TESTE" para dados de desenvolvimento:
- Usuários: `teste-operador@ecompack.com`
- Pedidos: Números altos (999999)

---

## 🎯 RESUMO RÁPIDO

| Comando | Afeta Produção? | Quando Usar |
|---------|----------------|-------------|
| `npm run dev` | ❌ Não | Sempre que for desenvolver |
| `git add .` | ❌ Não | Preparar arquivos para commit |
| `git commit -m "..."` | ❌ Não | Salvar mudanças localmente |
| `git push origin main` | ✅ **SIM** | Quando estiver pronto para produção |

---

## 📞 SUPORTE

Se tiver dúvidas, consulte este guia ou peça ajuda!
