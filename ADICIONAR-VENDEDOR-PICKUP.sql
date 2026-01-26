-- =====================================================
-- ADICIONAR CAMPO vendedor NA TABELA Pickup
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- Adicionar coluna vendedor (nome do vendedor do pedido - vem do Tiny)
ALTER TABLE "Pickup" ADD COLUMN IF NOT EXISTS "vendedor" TEXT;

-- Verificar se a coluna foi adicionada
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Pickup' 
ORDER BY ordinal_position;
