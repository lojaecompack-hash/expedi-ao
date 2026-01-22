-- ============================================
-- INSERIR USUÁRIO ADMIN - DESENVOLVIMENTO
-- ============================================
-- Execute em: https://supabase.com/dashboard/project/tkwlbedfasvvtwnuvrej/sql

-- Inserir usuário ADMIN
INSERT INTO "User" (id, email, name, password, role, "createdAt", "updatedAt")
VALUES (
  'cc7e0cdd-b55a-45ce-8d43-e426ff559ab',
  'lojaecompack@gmail.com',
  'Administrador',
  'supabase_auth',
  'ADMIN',
  NOW(),
  NOW()
);

-- Verificar resultado
SELECT id, email, name, role FROM "User";
