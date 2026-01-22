-- ============================================
-- INSERIR USUÁRIO ADMIN - DESENVOLVIMENTO
-- ============================================
-- Execute em: https://supabase.com/dashboard/project/tkwlbedfasvvtwnuvrej/sql

-- Tentar com hash vazio (a senha real está no Supabase Auth)
INSERT INTO "User" (id, email, name, "passwordHash", role, "isActive", "createdAt", "updatedAt")
VALUES (
  'cc7e0cdd-b55a-45ce-8d43-e426ff559ab',
  'lojaecompack@gmail.com',
  'Administrador',
  '',
  'ADMIN',
  true,
  NOW(),
  NOW()
);

-- Verificar resultado
SELECT id, email, name, role FROM "User";
