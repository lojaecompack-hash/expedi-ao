-- =====================================================
-- SCRIPT COMPLETO PARA APLICAR SCHEMA DO PRISMA
-- Execute no Supabase SQL Editor
-- https://supabase.com/dashboard/project/tkwlbedfasvvtwnuvrej/sql
-- =====================================================

-- 1. Adicionar colunas faltantes na tabela Order
ALTER TABLE "Order" 
ADD COLUMN IF NOT EXISTS "orderNumber" TEXT,
ADD COLUMN IF NOT EXISTS "customerName" TEXT,
ADD COLUMN IF NOT EXISTS "customerCpfHash" TEXT,
ADD COLUMN IF NOT EXISTS "statusTiny" TEXT,
ADD COLUMN IF NOT EXISTS "statusInterno" TEXT DEFAULT 'NOVO';

-- 2. Adicionar colunas faltantes na tabela Operator
ALTER TABLE "Operator" 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT;

-- 3. Criar índice único para email do Operator (apenas quando não for null)
CREATE UNIQUE INDEX IF NOT EXISTS "Operator_email_key" 
ON "Operator"(email) 
WHERE email IS NOT NULL;

-- 4. Verificar se todas as tabelas necessárias existem
-- Se alguma tabela não existir, será criada

-- Tabela User (deve já existir)
CREATE TABLE IF NOT EXISTS "User" (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "isActive" BOOLEAN DEFAULT true NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Tabela Workspace (deve já existir)
CREATE TABLE IF NOT EXISTS "Workspace" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  "userId" TEXT,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Workspace_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Workspace_name_key" UNIQUE (name)
);

-- Tabela Membership (deve já existir)
CREATE TABLE IF NOT EXISTS "Membership" (
  id TEXT PRIMARY KEY,
  "workspaceId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  email TEXT,
  permissions TEXT[] NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Membership_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Membership_workspaceId_userId_key" UNIQUE ("workspaceId", "userId")
);

-- Tabela TinySettings (deve já existir)
CREATE TABLE IF NOT EXISTS "TinySettings" (
  id TEXT PRIMARY KEY,
  "workspaceId" TEXT UNIQUE NOT NULL,
  "apiTokenEncrypted" TEXT NOT NULL,
  "isActive" BOOLEAN DEFAULT true NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TinySettings_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabela Order (deve já existir, mas vamos garantir que tenha todas as colunas)
CREATE TABLE IF NOT EXISTS "Order" (
  id TEXT PRIMARY KEY,
  "tinyOrderId" TEXT UNIQUE NOT NULL,
  "orderNumber" TEXT,
  "customerName" TEXT,
  "customerCpfHash" TEXT,
  "statusTiny" TEXT,
  "statusInterno" TEXT DEFAULT 'NOVO' NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Criar índices para Order se não existirem
CREATE INDEX IF NOT EXISTS "Order_customerCpfHash_idx" ON "Order"("customerCpfHash");
CREATE INDEX IF NOT EXISTS "Order_statusInterno_idx" ON "Order"("statusInterno");

-- Tabela Operator (deve já existir, mas vamos garantir que tenha todas as colunas)
CREATE TABLE IF NOT EXISTS "Operator" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  "passwordHash" TEXT DEFAULT '' NOT NULL,
  "isActive" BOOLEAN DEFAULT true NOT NULL,
  "userId" TEXT,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Operator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Criar índice para Operator se não existir
CREATE INDEX IF NOT EXISTS "Operator_userId_idx" ON "Operator"("userId");

-- Tabela Pickup
CREATE TABLE IF NOT EXISTS "Pickup" (
  id TEXT PRIMARY KEY,
  "orderId" TEXT NOT NULL,
  "operatorId" TEXT NOT NULL,
  "pickedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Pickup_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Pickup_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Criar índices para Pickup
CREATE INDEX IF NOT EXISTS "Pickup_orderId_idx" ON "Pickup"("orderId");
CREATE INDEX IF NOT EXISTS "Pickup_operatorId_idx" ON "Pickup"("operatorId");

-- Tabela SyncJob
CREATE TABLE IF NOT EXISTS "SyncJob" (
  id TEXT PRIMARY KEY,
  "orderId" TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING' NOT NULL,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SyncJob_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Criar índice para SyncJob
CREATE INDEX IF NOT EXISTS "SyncJob_orderId_idx" ON "SyncJob"("orderId");

-- Tabela ProductionOperator
CREATE TABLE IF NOT EXISTS "ProductionOperator" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  "passwordHash" TEXT NOT NULL,
  "isActive" BOOLEAN DEFAULT true NOT NULL,
  "userId" TEXT,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductionOperator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Criar índice para ProductionOperator
CREATE INDEX IF NOT EXISTS "ProductionOperator_userId_idx" ON "ProductionOperator"("userId");

-- Tabela Machine
CREATE TABLE IF NOT EXISTS "Machine" (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  "isActive" BOOLEAN DEFAULT true NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Tabela ProductionOrder
CREATE TABLE IF NOT EXISTS "ProductionOrder" (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  "machineId" TEXT NOT NULL,
  "productName" TEXT NOT NULL,
  "productMeasure" TEXT NOT NULL,
  "bobinaPesoInicial" DECIMAL(10,2) NOT NULL,
  "pesoTotalProduzido" DECIMAL(10,2) DEFAULT 0 NOT NULL,
  "totalApara" DECIMAL(10,2) DEFAULT 0 NOT NULL,
  status TEXT DEFAULT 'EM_ANDAMENTO' NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductionOrder_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Criar índice para ProductionOrder
CREATE INDEX IF NOT EXISTS "ProductionOrder_machineId_idx" ON "ProductionOrder"("machineId");

-- Tabela ProductionSession
CREATE TABLE IF NOT EXISTS "ProductionSession" (
  id TEXT PRIMARY KEY,
  "productionOrderId" TEXT NOT NULL,
  "operatorId" TEXT NOT NULL,
  turno TEXT NOT NULL,
  "inicioAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "fimAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductionSession_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "ProductionOrder"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ProductionSession_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "ProductionOperator"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Criar índices para ProductionSession
CREATE INDEX IF NOT EXISTS "ProductionSession_productionOrderId_idx" ON "ProductionSession"("productionOrderId");
CREATE INDEX IF NOT EXISTS "ProductionSession_operatorId_idx" ON "ProductionSession"("operatorId");

-- Tabela Parada
CREATE TABLE IF NOT EXISTS "Parada" (
  id TEXT PRIMARY KEY,
  "productionOrderId" TEXT NOT NULL,
  tipo TEXT NOT NULL,
  motivo TEXT,
  "inicioAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "fimAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Parada_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "ProductionOrder"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Criar índice para Parada
CREATE INDEX IF NOT EXISTS "Parada_productionOrderId_idx" ON "Parada"("productionOrderId");

-- Tabela Pacote
CREATE TABLE IF NOT EXISTS "Pacote" (
  id TEXT PRIMARY KEY,
  "productionOrderId" TEXT NOT NULL,
  peso DECIMAL(10,2) NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Pacote_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "ProductionOrder"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Criar índice para Pacote
CREATE INDEX IF NOT EXISTS "Pacote_productionOrderId_idx" ON "Pacote"("productionOrderId");

-- Tabela Apara
CREATE TABLE IF NOT EXISTS "Apara" (
  id TEXT PRIMARY KEY,
  "productionOrderId" TEXT NOT NULL,
  peso DECIMAL(10,2) NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Apara_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "ProductionOrder"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Criar índice para Apara
CREATE INDEX IF NOT EXISTS "Apara_productionOrderId_idx" ON "Apara"("productionOrderId");

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar estrutura da tabela Order
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'Order'
ORDER BY ordinal_position;

-- Verificar estrutura da tabela Operator
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'Operator'
ORDER BY ordinal_position;

-- Listar todas as tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
