-- Migração para usar Token API ao invés de OAuth
-- Execute este SQL no Supabase SQL Editor

-- 1. Adicionar nova coluna apiTokenEncrypted
ALTER TABLE "TinySettings" ADD COLUMN "apiTokenEncrypted" TEXT;

-- 2. Remover colunas antigas (se existirem dados, faça backup antes!)
ALTER TABLE "TinySettings" DROP COLUMN IF EXISTS "clientId";
ALTER TABLE "TinySettings" DROP COLUMN IF EXISTS "clientSecretEncrypted";

-- 3. Tornar apiTokenEncrypted obrigatório
ALTER TABLE "TinySettings" ALTER COLUMN "apiTokenEncrypted" SET NOT NULL;
