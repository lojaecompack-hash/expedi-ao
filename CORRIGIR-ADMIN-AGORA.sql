-- ============================================
-- CORRIGIR USUÁRIO ADMIN - PRODUÇÃO (AGORA)
-- ============================================
-- Execute em: https://supabase.com/dashboard/project/rlmjrholbksljnuevtcu/sql

-- Atualizar role para ADMIN
UPDATE "User"
SET role = 'ADMIN',
    "updatedAt" = NOW()
WHERE email = 'lojaecompack@gmail.com';

-- Verificar resultado
SELECT id, email, name, role FROM "User" WHERE email = 'lojaecompack@gmail.com';
