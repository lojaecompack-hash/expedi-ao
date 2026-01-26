-- =====================================================
-- ADICIONAR CAMPO trackingCode NA TABELA Pickup
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- Adicionar coluna trackingCode (código de rastreio - aceita número ou link)
ALTER TABLE "Pickup" ADD COLUMN IF NOT EXISTS "trackingCode" TEXT;

-- Verificar se a coluna foi adicionada
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Pickup' 
ORDER BY ordinal_position;
