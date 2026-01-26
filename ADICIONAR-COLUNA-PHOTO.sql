-- =====================================================
-- ADICIONAR COLUNA photo NA TABELA Pickup
-- Execute no Supabase SQL Editor
-- https://supabase.com/dashboard/project/tkwlbedfasvvtwnuvrej/sql
-- =====================================================

-- Adicionar coluna photo
ALTER TABLE "Pickup" 
ADD COLUMN IF NOT EXISTS "photo" TEXT;

-- Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'Pickup'
ORDER BY ordinal_position;
