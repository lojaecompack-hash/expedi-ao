-- ============================================
-- MIGRAÇÃO: NOVOS TIPOS DE USUÁRIO - ETAPA 1
-- ============================================
-- Execute PRIMEIRO em: https://supabase.com/dashboard/project/rlmjrholbksljnuevtcu/sql

-- IMPORTANTE: Execute esta etapa PRIMEIRO, depois execute a ETAPA 2 em uma query separada

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

-- ============================================
-- AGUARDE 5 SEGUNDOS APÓS EXECUTAR A ETAPA 1
-- DEPOIS EXECUTE A ETAPA 2 ABAIXO EM UMA NOVA QUERY
-- ============================================
