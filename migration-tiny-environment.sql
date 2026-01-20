-- Migration: Adicionar suporte a ambiente de teste/produção na Tiny API
-- Execute este SQL no Supabase SQL Editor

-- Adicionar colunas para token de teste e ambiente
ALTER TABLE "TinySettings" 
ADD COLUMN IF NOT EXISTS "apiTokenTestEncrypted" TEXT,
ADD COLUMN IF NOT EXISTS "environment" TEXT NOT NULL DEFAULT 'production';

-- Verificar se funcionou
SELECT id, "workspaceId", "environment", 
       CASE WHEN "apiTokenEncrypted" IS NOT NULL THEN 'Configurado' ELSE 'Não configurado' END as token_producao,
       CASE WHEN "apiTokenTestEncrypted" IS NOT NULL THEN 'Configurado' ELSE 'Não configurado' END as token_teste
FROM "TinySettings";
