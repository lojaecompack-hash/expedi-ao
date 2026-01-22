-- ============================================
-- LIMPAR E RECRIAR USUÁRIOS - PRODUÇÃO (V2)
-- ============================================
-- Execute em: https://supabase.com/dashboard/project/rlmjrholbksljnuevtcu/sql

-- PASSO 1: Listar usuários atuais
SELECT id, email, name, role FROM "User";

-- PASSO 2: Deletar todos os usuários
DELETE FROM "Membership";
DELETE FROM "User";

-- PASSO 3: Criar usuário ADMIN
-- IMPORTANTE: Primeiro crie o usuário no Supabase Auth
-- 1. Vá em: https://supabase.com/dashboard/project/rlmjrholbksljnuevtcu/auth/users
-- 2. Clique em "Add User" > "Create new user"
-- 3. Email: lojaecompack@gmail.com
-- 4. Senha: (sua senha)
-- 5. Copie o UUID gerado
-- 6. Substitua 'SEU-UUID-AQUI' abaixo pelo UUID copiado

INSERT INTO "User" (id, email, name, password, role, "createdAt", "updatedAt")
VALUES (
  'SEU-UUID-AQUI',  -- Substitua pelo UUID do Supabase Auth
  'lojaecompack@gmail.com',
  'Administrador',
  'supabase_auth',  -- Senha gerenciada pelo Supabase Auth
  'ADMIN',
  NOW(),
  NOW()
);

-- PASSO 4: Verificar
SELECT id, email, name, role FROM "User";
