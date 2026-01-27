-- =====================================================
-- ADICIONAR CAMPOS DE SETOR NA TABELA OCORRENCIA
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- Adicionar campo setorOrigem (setor de quem abriu a ocorrência)
ALTER TABLE "Ocorrencia" 
ADD COLUMN IF NOT EXISTS "setorOrigem" TEXT;

-- Adicionar campo setorDestino (setor para quem a ocorrência foi direcionada)
ALTER TABLE "Ocorrencia" 
ADD COLUMN IF NOT EXISTS "setorDestino" TEXT;

-- Adicionar campo statusOcorrencia (PENDENTE, RESPONDIDA, ENCERRADA)
ALTER TABLE "Ocorrencia" 
ADD COLUMN IF NOT EXISTS "statusOcorrencia" TEXT DEFAULT 'PENDENTE';

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS "Ocorrencia_setorDestino_idx" ON "Ocorrencia"("setorDestino");
CREATE INDEX IF NOT EXISTS "Ocorrencia_statusOcorrencia_idx" ON "Ocorrencia"("statusOcorrencia");

-- Verificar se as colunas foram criadas
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'Ocorrencia';
