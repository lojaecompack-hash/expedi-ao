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

-- 3. Verificar se as colunas foram adicionadas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Ocorrencia' 
AND column_name IN ('remetenteId', 'destinatarioId', 'destinatarioTipo');

-- NOTA: Os gerentes agora são gerenciados dinamicamente pela interface!
-- Acesse /usuarios e clique no botão "Gerente" para marcar/desmarcar usuários.
