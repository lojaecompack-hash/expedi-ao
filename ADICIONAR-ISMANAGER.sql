-- Adicionar coluna isManager na tabela User
-- Execute este SQL no Supabase SQL Editor

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isManager" BOOLEAN DEFAULT false;

-- Atualizar registros existentes para ter valor padrão
UPDATE "User" SET "isManager" = false WHERE "isManager" IS NULL;

-- Verificar se a coluna foi adicionada
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'User' AND column_name = 'isManager';
