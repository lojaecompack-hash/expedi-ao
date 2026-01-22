-- ============================================
-- INSERIR USUÁRIO ADMIN - DESENVOLVIMENTO (SEM PASSWORD)
-- ============================================
-- Execute em: https://supabase.com/dashboard/project/tkwlbedfasvvtwnuvrej/sql

-- A senha é gerenciada pelo Supabase Auth, não pela tabela User
-- Inserir apenas os campos obrigatórios

INSERT INTO "User" (id, email, name, role, "createdAt", "updatedAt")
VALUES (
  'cc7e0cdd-b55a-45ce-8d43-e426ff559ab',
  'lojaecompack@gmail.com',
  'Administrador',
  'ADMIN',
  NOW(),
  NOW()
);

-- Verificar resultado
SELECT id, email, name, role FROM "User";
