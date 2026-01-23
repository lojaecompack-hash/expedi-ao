-- =====================================================
-- ADICIONAR COLUNA retrieverName NA TABELA Pickup
-- Execute no Supabase SQL Editor
-- https://supabase.com/dashboard/project/tkwlbedfasvvtwnuvrej/sql
-- =====================================================

-- Adicionar coluna retrieverName
ALTER TABLE "Pickup" 
ADD COLUMN IF NOT EXISTS "retrieverName" TEXT;

-- Adicionar colunas adicionais que podem estar faltando
ALTER TABLE "Pickup"
ADD COLUMN IF NOT EXISTS "operatorName" TEXT,
ADD COLUMN IF NOT EXISTS "customerName" TEXT,
ADD COLUMN IF NOT EXISTS "customerCpfCnpj" TEXT,
ADD COLUMN IF NOT EXISTS "photoUrl" TEXT;

-- Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'Pickup'
ORDER BY ordinal_position;
