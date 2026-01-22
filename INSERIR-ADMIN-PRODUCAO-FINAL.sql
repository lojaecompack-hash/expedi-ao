-- ============================================
-- INSERIR USUÁRIO ADMIN - PRODUÇÃO (FINAL)
-- ============================================
-- Execute em: https://supabase.com/dashboard/project/rlmjrholbksljnuevtcu/sql

-- Verificar se já existe
SELECT id, email, name, role FROM "User" WHERE email = 'lojaecompack@gmail.com';

-- Se já existir, atualizar:
UPDATE "User"
SET role = 'ADMIN',
    name = 'Administrador',
    "isActive" = true,
    "updatedAt" = NOW()
WHERE email = 'lojaecompack@gmail.com';

-- Se NÃO existir, inserir:
-- (Descomente as linhas abaixo se o UPDATE acima não retornar nenhuma linha)
/*
INSERT INTO "User" (id, email, name, "passwordHash", role, "isActive", "createdAt", "updatedAt")
VALUES (
  'a7105232-d6dd-4ce1-aab9-ad736bbda99e',
  'lojaecompack@gmail.com',
  'Administrador',
  'supabase_auth',
  'ADMIN',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  role = 'ADMIN',
  name = 'Administrador',
  "isActive" = true,
  "updatedAt" = NOW();
*/

-- Verificar resultado final
SELECT id, email, name, role, "isActive" FROM "User";
