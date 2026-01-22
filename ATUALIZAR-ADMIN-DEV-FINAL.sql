-- ============================================
-- ATUALIZAR USUÁRIO PARA ADMIN - DEV
-- ============================================
-- Execute em: https://supabase.com/dashboard/project/tkwlbedfasvvtwnuvrej/sql

-- Atualizar usuário existente para ADMIN
UPDATE "User"
SET role = 'ADMIN',
    name = 'Administrador',
    "isActive" = true,
    "updatedAt" = NOW()
WHERE email = 'lojaecompack@gmail.com';

-- Verificar resultado
SELECT id, email, name, role, "isActive" FROM "User";
