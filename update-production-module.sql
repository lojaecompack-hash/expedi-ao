-- ========================================
-- ATUALIZAÇÃO DO MÓDULO DE PRODUÇÃO
-- Adicionar suporte a múltiplas bobinas
-- Execute este SQL no Supabase SQL Editor
-- ========================================

-- 1. Criar tabela ProductionBobina
CREATE TABLE IF NOT EXISTS "ProductionBobina" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "orderId" TEXT NOT NULL,
    
    "sequencia" INTEGER NOT NULL,
    "bobinaSku" TEXT NOT NULL,
    "pesoInicial" DECIMAL NOT NULL,
    "pesoRestante" DECIMAL,
    "bobinaOrigem" TEXT,
    
    "inicioAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fimAt" TIMESTAMP(3),
    
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "ProductionBobina_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "ProductionOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ProductionBobina_orderId_idx" ON "ProductionBobina"("orderId");

-- 2. Alterar ProductionOrder - remover campos de bobina única
ALTER TABLE "ProductionOrder" DROP COLUMN IF EXISTS "bobinaSku";
ALTER TABLE "ProductionOrder" DROP COLUMN IF EXISTS "bobinaPesoInicial";
ALTER TABLE "ProductionOrder" DROP COLUMN IF EXISTS "bobinaPesoFinal";
ALTER TABLE "ProductionOrder" DROP COLUMN IF EXISTS "bobinaOrigem";

-- 3. Alterar ProductionOrder - tornar campos opcionais (lançados no final)
ALTER TABLE "ProductionOrder" ALTER COLUMN "pesoTotalProduzido" DROP NOT NULL;
ALTER TABLE "ProductionOrder" ALTER COLUMN "pesoTotalProduzido" DROP DEFAULT;
ALTER TABLE "ProductionOrder" ALTER COLUMN "totalPacotes" DROP NOT NULL;
ALTER TABLE "ProductionOrder" ALTER COLUMN "totalPacotes" DROP DEFAULT;
ALTER TABLE "ProductionOrder" ALTER COLUMN "totalUnidades" DROP NOT NULL;
ALTER TABLE "ProductionOrder" ALTER COLUMN "totalUnidades" DROP DEFAULT;

-- 4. Remover índice antigo de bobinaSku
DROP INDEX IF EXISTS "ProductionOrder_bobinaSku_idx";

-- 5. Verificar tabelas criadas/atualizadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('ProductionBobina', 'ProductionOrder')
ORDER BY table_name;
