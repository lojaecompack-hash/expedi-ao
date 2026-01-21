-- ============================================
-- CORRIGIR USUÁRIO ADMIN - PRODUÇÃO
-- ============================================
-- Execute em: https://supabase.com/dashboard/project/rlmjrholbksljnuevtcu/sql

-- 1. Listar todos os usuários
SELECT id, email, name, role FROM "User";

-- 2. Atualizar role para ADMIN
UPDATE "User"
SET role = 'ADMIN',
    "updatedAt" = NOW()
WHERE email = 'lojaecompack@gmail.com';

-- 3. Verificar resultado
SELECT id, email, name, role FROM "User" WHERE email = 'lojaecompack@gmail.com';
