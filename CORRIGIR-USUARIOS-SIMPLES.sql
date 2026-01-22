-- ============================================
-- CORRIGIR USUÁRIOS - PRODUÇÃO (SIMPLES)
-- ============================================
-- Execute em: https://supabase.com/dashboard/project/rlmjrholbksljnuevtcu/sql

-- PASSO 1: Ver todos os usuários atuais
SELECT id, email, name, role FROM "User";

-- PASSO 2: Atualizar o usuário lojaecompack para ADMIN
UPDATE "User"
SET role = 'ADMIN',
    name = 'Administrador',
    "updatedAt" = NOW()
WHERE email = 'lojaecompack@gmail.com';

-- PASSO 3: Deletar outros usuários (expedição, produção, etc)
DELETE FROM "User" 
WHERE email != 'lojaecompack@gmail.com';

-- PASSO 4: Verificar resultado final
SELECT id, email, name, role FROM "User";
