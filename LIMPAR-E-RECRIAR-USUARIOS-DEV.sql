-- ============================================
-- LIMPAR E RECRIAR USUÁRIOS - DESENVOLVIMENTO
-- ============================================
-- Execute em: https://supabase.com/dashboard/project/tkwlbedfasvvtwnuvrej/sql

-- PASSO 1: Listar usuários atuais (para backup)
SELECT id, email, name, role FROM "User";

-- PASSO 2: Deletar todos os usuários (exceto system se houver)
DELETE FROM "Membership";
DELETE FROM "User" WHERE email != 'system@supabase.io';

-- PASSO 3: Criar usuário ADMIN
-- IMPORTANTE: Use o ID do Supabase Auth para este usuário
-- Você deve primeiro criar o usuário no Supabase Auth (Authentication > Users > Add User)
-- Email: lojaecompack@gmail.com
-- Senha: (sua senha)
-- Depois copie o UUID gerado e cole abaixo no lugar de 'SEU-UUID-AQUI'

INSERT INTO "User" (id, email, name, role, "createdAt", "updatedAt")
VALUES (
  'SEU-UUID-AQUI',  -- Substitua pelo UUID do Supabase Auth
  'lojaecompack@gmail.com',
  'Administrador',
  'ADMIN',
  NOW(),
  NOW()
);

-- PASSO 4: Verificar
SELECT id, email, name, role FROM "User";

-- ============================================
-- INSTRUÇÕES:
-- ============================================
-- 1. Vá em: https://supabase.com/dashboard/project/tkwlbedfasvvtwnuvrej/auth/users
-- 2. Clique em "Add User" > "Create new user"
-- 3. Email: lojaecompack@gmail.com
-- 4. Senha: (sua senha)
-- 5. Clique em "Create user"
-- 6. Copie o UUID do usuário criado
-- 7. Execute este script substituindo 'SEU-UUID-AQUI' pelo UUID copiado
