-- ============================================
-- VERIFICAR ROLE DO USUÁRIO EM PRODUÇÃO
-- ============================================
-- Execute em: https://supabase.com/dashboard/project/rlmjrholbksljnuevtcu/sql

-- Verificar role atual
SELECT id, email, name, role, "isActive", "createdAt", "updatedAt"
FROM "User" 
WHERE email = 'lojaecompack@gmail.com';

-- Se a role não for ADMIN, execute este UPDATE:
/*
UPDATE "User"
SET role = 'ADMIN',
    name = 'Administrador',
    "isActive" = true,
    "updatedAt" = NOW()
WHERE email = 'lojaecompack@gmail.com';

-- Verificar novamente
SELECT id, email, name, role, "isActive"
FROM "User" 
WHERE email = 'lojaecompack@gmail.com';
*/
