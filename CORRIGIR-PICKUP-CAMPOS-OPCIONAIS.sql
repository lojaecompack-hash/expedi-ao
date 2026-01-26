-- =====================================================
-- CORRIGIR CAMPOS OPCIONAIS NA TABELA Pickup
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- Tornar TODOS os campos opcionais (exceto id e orderId)
ALTER TABLE "Pickup" ALTER COLUMN "cpfLast4" DROP NOT NULL;
ALTER TABLE "Pickup" ALTER COLUMN "operatorId" DROP NOT NULL;
ALTER TABLE "Pickup" ALTER COLUMN "operatorName" DROP NOT NULL;
ALTER TABLE "Pickup" ALTER COLUMN "customerName" DROP NOT NULL;
ALTER TABLE "Pickup" ALTER COLUMN "customerCpfCnpj" DROP NOT NULL;
ALTER TABLE "Pickup" ALTER COLUMN "retrieverName" DROP NOT NULL;
ALTER TABLE "Pickup" ALTER COLUMN "trackingCode" DROP NOT NULL;
ALTER TABLE "Pickup" ALTER COLUMN "photo" DROP NOT NULL;

-- Verificar se as alterações foram aplicadas
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Pickup' 
ORDER BY ordinal_position;
