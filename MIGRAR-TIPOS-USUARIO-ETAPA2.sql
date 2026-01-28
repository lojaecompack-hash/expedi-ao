-- ============================================
-- MIGRAÇÃO: NOVOS TIPOS DE USUÁRIO - ETAPA 2
-- ============================================
-- Execute DEPOIS da ETAPA 1 em: https://supabase.com/dashboard/project/rlmjrholbksljnuevtcu/sql

-- IMPORTANTE: Só execute esta etapa DEPOIS de executar a ETAPA 1 e aguardar 5 segundos

-- 3. Migrar usuários existentes de PRODUCAO para CORTE_SOLDA
UPDATE "User" SET role = 'CORTE_SOLDA' WHERE role = 'PRODUCAO';

-- 4. Verificar resultado
SELECT id, email, name, role FROM "User" ORDER BY role, name;
