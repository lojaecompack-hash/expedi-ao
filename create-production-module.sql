-- ========================================
-- MÓDULO DE PRODUÇÃO - CORTE E SOLDA
-- Execute este SQL no Supabase SQL Editor
-- ========================================

-- 1. Criar enums
DO $$ BEGIN
    CREATE TYPE "ProductionOrderStatus" AS ENUM ('EM_ANDAMENTO', 'PAUSADA', 'AGUARDANDO_CONF', 'CONFERIDO', 'CANCELADO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "TurnoType" AS ENUM ('MANHA', 'TARDE', 'NOITE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ParadaType" AS ENUM ('ALMOCO', 'MANUTENCAO', 'BANHEIRO', 'SETUP', 'FALTA_BOBINA', 'OUTROS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Criar tabela Machine (Máquinas)
CREATE TABLE IF NOT EXISTS "Machine" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "code" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "currentOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Inserir as 10 máquinas
INSERT INTO "Machine" ("id", "code", "name", "isActive") VALUES
    (gen_random_uuid()::text, 'MAQ-01', 'Máquina 01', true),
    (gen_random_uuid()::text, 'MAQ-02', 'Máquina 02', true),
    (gen_random_uuid()::text, 'MAQ-03', 'Máquina 03', true),
    (gen_random_uuid()::text, 'MAQ-04', 'Máquina 04', true),
    (gen_random_uuid()::text, 'MAQ-05', 'Máquina 05', true),
    (gen_random_uuid()::text, 'MAQ-06', 'Máquina 06', true),
    (gen_random_uuid()::text, 'MAQ-07', 'Máquina 07', true),
    (gen_random_uuid()::text, 'MAQ-08', 'Máquina 08', true),
    (gen_random_uuid()::text, 'MAQ-09', 'Máquina 09', true),
    (gen_random_uuid()::text, 'MAQ-10', 'Máquina 10', true)
ON CONFLICT ("code") DO NOTHING;

-- 4. Criar tabela ProductionOrder (Ordens de Produção)
CREATE TABLE IF NOT EXISTS "ProductionOrder" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "code" TEXT NOT NULL UNIQUE,
    
    "productSku" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "productMeasure" TEXT NOT NULL,
    
    "bobinaSku" TEXT NOT NULL,
    "bobinaPesoInicial" DECIMAL NOT NULL,
    "bobinaPesoFinal" DECIMAL,
    "bobinaOrigem" TEXT,
    
    "turnoInicial" "TurnoType" NOT NULL,
    
    "pesoTotalProduzido" DECIMAL NOT NULL DEFAULT 0,
    "totalApara" DECIMAL NOT NULL DEFAULT 0,
    "totalPacotes" INTEGER NOT NULL DEFAULT 0,
    "totalUnidades" INTEGER NOT NULL DEFAULT 0,
    
    "confPesoReal" DECIMAL,
    "confUnidadesReal" INTEGER,
    "confPacotesReal" INTEGER,
    "confDivergencia" BOOLEAN NOT NULL DEFAULT false,
    "confObservacao" TEXT,
    "confUserId" TEXT,
    "confAt" TIMESTAMP(3),
    
    "consumoCola" DECIMAL,
    "consumoLine" DECIMAL,
    
    "status" "ProductionOrderStatus" NOT NULL DEFAULT 'EM_ANDAMENTO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    
    "createdByUserId" TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS "ProductionOrder_status_idx" ON "ProductionOrder"("status");
CREATE INDEX IF NOT EXISTS "ProductionOrder_productSku_idx" ON "ProductionOrder"("productSku");
CREATE INDEX IF NOT EXISTS "ProductionOrder_bobinaSku_idx" ON "ProductionOrder"("bobinaSku");

-- 5. Criar tabela ProductionSession (Sessões de Produção)
CREATE TABLE IF NOT EXISTS "ProductionSession" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "orderId" TEXT NOT NULL,
    
    "operatorId" TEXT NOT NULL,
    "operatorName" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "turno" "TurnoType" NOT NULL,
    
    "inicioAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fimAt" TIMESTAMP(3),
    
    "pesoSessao" DECIMAL NOT NULL DEFAULT 0,
    "aparaSessao" DECIMAL NOT NULL DEFAULT 0,
    
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "ProductionSession_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "ProductionOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProductionSession_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ProductionSession_orderId_idx" ON "ProductionSession"("orderId");
CREATE INDEX IF NOT EXISTS "ProductionSession_operatorId_idx" ON "ProductionSession"("operatorId");
CREATE INDEX IF NOT EXISTS "ProductionSession_machineId_idx" ON "ProductionSession"("machineId");

-- 6. Criar tabela ProductionPackage (Pacotes Produzidos)
CREATE TABLE IF NOT EXISTS "ProductionPackage" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "orderId" TEXT NOT NULL,
    
    "sequencia" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL,
    
    "sessionId" TEXT,
    "operatorName" TEXT,
    "machineName" TEXT,
    "turno" "TurnoType",
    
    "etiquetaCodigo" TEXT NOT NULL UNIQUE,
    "etiquetaGerada" BOOLEAN NOT NULL DEFAULT false,
    "etiquetaGeradaAt" TIMESTAMP(3),
    
    "conferido" BOOLEAN NOT NULL DEFAULT false,
    "conferidoAt" TIMESTAMP(3),
    
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "ProductionPackage_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "ProductionOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ProductionPackage_orderId_idx" ON "ProductionPackage"("orderId");
CREATE INDEX IF NOT EXISTS "ProductionPackage_etiquetaCodigo_idx" ON "ProductionPackage"("etiquetaCodigo");

-- 7. Criar tabela ProductionApara (Aparas/Descarte)
CREATE TABLE IF NOT EXISTS "ProductionApara" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "orderId" TEXT NOT NULL,
    
    "peso" DECIMAL NOT NULL,
    "operatorId" TEXT NOT NULL,
    "operatorName" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "turno" "TurnoType" NOT NULL,
    
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "ProductionApara_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "ProductionOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ProductionApara_orderId_idx" ON "ProductionApara"("orderId");

-- 8. Criar tabela MachineParada (Paradas de Máquina)
CREATE TABLE IF NOT EXISTS "MachineParada" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "machineId" TEXT NOT NULL,
    
    "tipo" "ParadaType" NOT NULL,
    "motivo" TEXT,
    
    "operatorId" TEXT,
    "operatorName" TEXT,
    "turno" "TurnoType" NOT NULL,
    
    "inicioAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fimAt" TIMESTAMP(3),
    "duracaoMin" INTEGER,
    
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "MachineParada_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "MachineParada_machineId_idx" ON "MachineParada"("machineId");
CREATE INDEX IF NOT EXISTS "MachineParada_tipo_idx" ON "MachineParada"("tipo");

-- 9. Criar tabela ProductionDivergencia (Log de Divergências)
CREATE TABLE IF NOT EXISTS "ProductionDivergencia" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "orderId" TEXT NOT NULL,
    
    "qtdOperador" INTEGER NOT NULL,
    "pesoOperador" DECIMAL NOT NULL,
    "pacotesOperador" INTEGER NOT NULL,
    
    "qtdConferido" INTEGER NOT NULL,
    "pesoConferido" DECIMAL NOT NULL,
    "pacotesConferido" INTEGER NOT NULL,
    
    "qtdDiferenca" INTEGER NOT NULL,
    "pesoDiferenca" DECIMAL NOT NULL,
    
    "ajustadoPorId" TEXT NOT NULL,
    "ajustadoPorName" TEXT NOT NULL,
    "observacao" TEXT,
    
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "ProductionDivergencia_orderId_idx" ON "ProductionDivergencia"("orderId");

-- 10. Criar tabela ProductionConfig (Configurações)
CREATE TABLE IF NOT EXISTS "ProductionConfig" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    
    "colaSku" TEXT,
    "lineSku" TEXT,
    
    "colaPercent" DECIMAL,
    "lineMetrosPorKg" DECIMAL,
    
    "aparaEstimada" JSONB,
    
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 11. Inserir configuração padrão
INSERT INTO "ProductionConfig" ("id", "aparaEstimada") 
VALUES (gen_random_uuid()::text, '{"19x25": 8, "26x36": 10, "32x40": 12}')
ON CONFLICT DO NOTHING;

-- 12. Verificar tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('Machine', 'ProductionOrder', 'ProductionSession', 'ProductionPackage', 'ProductionApara', 'MachineParada', 'ProductionDivergencia', 'ProductionConfig')
ORDER BY table_name;
