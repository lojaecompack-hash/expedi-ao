-- Configurar sistema de mensagens com gerentes
-- Execute este SQL no Supabase SQL Editor

-- 1. Adicionar novos campos na tabela Ocorrencia
ALTER TABLE "Ocorrencia" ADD COLUMN IF NOT EXISTS "remetenteId" TEXT;
ALTER TABLE "Ocorrencia" ADD COLUMN IF NOT EXISTS "destinatarioId" TEXT;
ALTER TABLE "Ocorrencia" ADD COLUMN IF NOT EXISTS "destinatarioTipo" TEXT;

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS "Ocorrencia_remetenteId_idx" ON "Ocorrencia"("remetenteId");
CREATE INDEX IF NOT EXISTS "Ocorrencia_destinatarioId_idx" ON "Ocorrencia"("destinatarioId");
CREATE INDEX IF NOT EXISTS "Ocorrencia_destinatarioTipo_idx" ON "Ocorrencia"("destinatarioTipo");

-- 3. Marcar os gerentes (Patrícia, Soraia e Rodrigo)
UPDATE "User" SET "isManager" = true WHERE name = 'Patrícia Esteves';
UPDATE "User" SET "isManager" = true WHERE name = 'Soraia Mello';
UPDATE "User" SET "isManager" = true WHERE name = 'Rodrigo';

-- 4. Verificar se os gerentes foram marcados corretamente
SELECT name, email, role, "isManager" FROM "User" WHERE "isManager" = true;

-- 5. Verificar se as colunas foram adicionadas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Ocorrencia' 
AND column_name IN ('remetenteId', 'destinatarioId', 'destinatarioTipo');
