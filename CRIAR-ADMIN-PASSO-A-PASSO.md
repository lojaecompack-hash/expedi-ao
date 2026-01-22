# 📋 CRIAR USUÁRIO ADMIN - PASSO A PASSO

## 🔴 PRODUÇÃO (expedicaoecompack)

### PASSO 1: Criar no Supabase Auth
1. Acesse: https://supabase.com/dashboard/project/rlmjrholbksljnuevtcu/auth/users
2. Clique em **"Add User"** → **"Create new user"**
3. Preencha:
   - Email: `lojaecompack@gmail.com`
   - Senha: (sua senha)
   - ✅ Marque: **"Auto Confirm User"**
4. Clique em **"Create user"**
5. **COPIE o UUID** que aparece (ex: `490e5920-f075-4332-b7bf-34089a9b1f1f`)

### PASSO 2: Inserir na tabela User
1. Acesse: https://supabase.com/dashboard/project/rlmjrholbksljnuevtcu/sql/new
2. Cole este SQL (substituindo o UUID):

```sql
INSERT INTO "User" (id, email, name, password, role, "createdAt", "updatedAt")
VALUES (
  'SEU-UUID-AQUI',
  'lojaecompack@gmail.com',
  'Administrador',
  'supabase_auth',
  'ADMIN',
  NOW(),
  NOW()
);

-- Verificar
SELECT id, email, name, role FROM "User";
```

---

## 🟢 DESENVOLVIMENTO (tiny-expedicao-dev)

### PASSO 1: Criar no Supabase Auth
1. Acesse: https://supabase.com/dashboard/project/tkwlbedfasvvtwnuvrej/auth/users
2. Clique em **"Add User"** → **"Create new user"**
3. Preencha:
   - Email: `lojaecompack@gmail.com`
   - Senha: (mesma senha)
   - ✅ Marque: **"Auto Confirm User"**
4. Clique em **"Create user"**
5. **COPIE o UUID**

### PASSO 2: Inserir na tabela User
1. Acesse: https://supabase.com/dashboard/project/tkwlbedfasvvtwnuvrej/sql/new
2. Cole este SQL (substituindo o UUID):

```sql
INSERT INTO "User" (id, email, name, password, role, "createdAt", "updatedAt")
VALUES (
  'SEU-UUID-AQUI',
  'lojaecompack@gmail.com',
  'Administrador',
  'supabase_auth',
  'ADMIN',
  NOW(),
  NOW()
);

-- Verificar
SELECT id, email, name, role FROM "User";
```

---

## ✅ TESTAR

1. **Produção**: Acesse `www.ecomlogic.com.br` e faça login
2. **Localhost**: Acesse `localhost:3000` e faça login

Ambos devem mostrar Dashboard ADMIN com menu completo:
- Dashboard
- Produção
- Retirada
- Relatórios
- Usuários
- Configurações
