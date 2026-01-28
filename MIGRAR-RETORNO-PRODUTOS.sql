-- ============================================
-- MIGRAÇÃO: RETORNO DE PRODUTOS E RE-RETIRADA
-- ============================================
-- Execute em: https://supabase.com/dashboard/project/rlmjrholbksljnuevtcu/sql

-- 1. Adicionar campos no Pickup para re-retirada
ALTER TABLE "Pickup" ADD COLUMN IF NOT EXISTS "retiradaAnteriorId" TEXT;
ALTER TABLE "Pickup" ADD COLUMN IF NOT EXISTS "numeroRetirada" INTEGER DEFAULT 1;

-- 2. Adicionar campos na Ocorrencia para tipo e motivo
ALTER TABLE "Ocorrencia" ADD COLUMN IF NOT EXISTS "tipoOcorrencia" TEXT DEFAULT 'INFORMACAO';
ALTER TABLE "Ocorrencia" ADD COLUMN IF NOT EXISTS "motivoRetorno" TEXT;

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS "Pickup_status_idx" ON "Pickup"("status");
CREATE INDEX IF NOT EXISTS "Pickup_retiradaAnteriorId_idx" ON "Pickup"("retiradaAnteriorId");
CREATE INDEX IF NOT EXISTS "Ocorrencia_tipoOcorrencia_idx" ON "Ocorrencia"("tipoOcorrencia");

-- 4. Verificar resultado
SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'Pickup' 
  AND column_name IN ('retiradaAnteriorId', 'numeroRetirada', 'status');

SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'Ocorrencia' 
  AND column_name IN ('tipoOcorrencia', 'motivoRetorno');
