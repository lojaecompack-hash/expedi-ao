-- ============================================
-- PASSO 1: VERIFICAR ESTRUTURA DA TABELA
-- ============================================
-- Execute em: https://supabase.com/dashboard/project/tkwlbedfasvvtwnuvrej/sql

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'User'
ORDER BY ordinal_position;

-- ============================================
-- PASSO 2: DEPOIS DE VER A ESTRUTURA, EXECUTE:
-- ============================================

-- Opção A: Se a coluna for "passwordHash" (camelCase)
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

-- Opção B: Se a coluna for "password_hash" (snake_case)
-- INSERT INTO "User" (id, email, name, "password_hash", role, "is_active", "created_at", "updated_at")
-- VALUES (
--   'cc7e0cdd-b55a-45ce-8d43-e426ff559ab',
--   'lojaecompack@gmail.com',
--   'Administrador',
--   '',
--   'ADMIN',
--   true,
--   NOW(),
--   NOW()
-- );

-- Verificar resultado
SELECT id, email, name, role FROM "User";
