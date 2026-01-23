-- =====================================================
-- ADICIONAR COLUNA cpfLast4 NA TABELA Pickup
-- Execute no Supabase SQL Editor
-- https://supabase.com/dashboard/project/tkwlbedfasvvtwnuvrej/sql
-- =====================================================

-- Adicionar coluna cpfLast4 na tabela Pickup
ALTER TABLE "Pickup" 
ADD COLUMN IF NOT EXISTS "cpfLast4" TEXT;

-- Verificar estrutura da tabela Pickup
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'Pickup'
ORDER BY ordinal_position;
