-- ============================================
-- MIGRAÇÃO: TRANSFERIR VENDAS E FINANCEIRO
-- ============================================
-- Execute em: https://supabase.com/dashboard/project/rlmjrholbksljnuevtcu/sql
-- IMPORTANTE: Execute DEPOIS de ter rodado MIGRAR-TIPOS-USUARIO.sql (ETAPA 1 e 2)

-- 1. Alterar vendas@ecompack.com.br de EXPEDICAO para VENDAS
UPDATE "User" SET role = 'VENDAS' WHERE email = 'vendas@ecompack.com.br';

-- 2. Alterar financeiro@ecompack.com.br de EXPEDICAO para FINANCEIRO
UPDATE "User" SET role = 'FINANCEIRO' WHERE email = 'financeiro@ecompack.com.br';

-- 3. Verificar resultado
SELECT id, email, name, role FROM "User" WHERE email IN ('vendas@ecompack.com.br', 'financeiro@ecompack.com.br');
