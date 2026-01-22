-- ============================================
-- ATUALIZAR USUÁRIO PARA ADMIN - PRODUÇÃO
-- ============================================
-- Execute em: https://supabase.com/dashboard/project/rlmjrholbksljnuevtcu/sql

-- Atualizar usuário existente para ADMIN
UPDATE "User"
SET role = 'ADMIN',
    name = 'Administrador',
    "isActive" = true,
    "updatedAt" = NOW()
WHERE email = 'lojaecompack@gmail.com';

-- Verificar resultado
SELECT id, email, name, role, "isActive" FROM "User";
