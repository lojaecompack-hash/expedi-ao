-- Adicionar coluna photo2 na tabela Pickup
-- Execute este SQL no Supabase SQL Editor

ALTER TABLE "Pickup" ADD COLUMN IF NOT EXISTS "photo2" TEXT;

-- Verificar se a coluna foi adicionada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Pickup' 
AND column_name = 'photo2';
