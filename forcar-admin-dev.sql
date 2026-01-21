-- Forçar role ADMIN para lojaecompack@gmail.com no banco DEV
-- Execute em: https://supabase.com/dashboard/project/tkwlbedfasvvtwnuvrej/sql

-- 1. Atualizar role para ADMIN
UPDATE "User"
SET role = 'ADMIN',
    "updatedAt" = NOW()
WHERE email = 'lojaecompack@gmail.com';

-- 2. Verificar resultado
SELECT 
  id,
  email,
  name,
  role,
  "createdAt",
  "updatedAt"
FROM "User"
WHERE email = 'lojaecompack@gmail.com';
