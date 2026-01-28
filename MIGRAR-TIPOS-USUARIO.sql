-- ============================================
-- MIGRAÇÃO: NOVOS TIPOS DE USUÁRIO
-- ============================================
-- Execute em: https://supabase.com/dashboard/project/rlmjrholbksljnuevtcu/sql

-- 1. Adicionar novos valores ao enum UserRole
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'CORTE_SOLDA';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'EXTRUSORA';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'ESTOQUE';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'VENDAS';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'FINANCEIRO';

-- 2. Adicionar novos valores ao enum ModulePermission
ALTER TYPE "ModulePermission" ADD VALUE IF NOT EXISTS 'CORTE_SOLDA';
ALTER TYPE "ModulePermission" ADD VALUE IF NOT EXISTS 'EXTRUSORA';
ALTER TYPE "ModulePermission" ADD VALUE IF NOT EXISTS 'ESTOQUE';
ALTER TYPE "ModulePermission" ADD VALUE IF NOT EXISTS 'VENDAS';
ALTER TYPE "ModulePermission" ADD VALUE IF NOT EXISTS 'FINANCEIRO';

-- 3. Migrar usuários existentes de PRODUCAO para CORTE_SOLDA
UPDATE "User" SET role = 'CORTE_SOLDA' WHERE role = 'PRODUCAO';

-- 4. Verificar resultado
SELECT id, email, name, role FROM "User" ORDER BY role, name;
