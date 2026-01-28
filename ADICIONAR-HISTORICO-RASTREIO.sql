-- =============================================
-- ADICIONAR CAMPOS DE HISTÓRICO DE RASTREIO
-- Execute este SQL no Supabase SQL Editor
-- =============================================

-- Adicionar campo para rastreio anterior
ALTER TABLE "Pickup" ADD COLUMN IF NOT EXISTS "previousTrackingCode" TEXT;

-- Adicionar campo para data da atualização do rastreio
ALTER TABLE "Pickup" ADD COLUMN IF NOT EXISTS "trackingUpdatedAt" TIMESTAMP(3);

-- Verificar se os campos foram criados
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Pickup' 
AND column_name IN ('previousTrackingCode', 'trackingUpdatedAt');
