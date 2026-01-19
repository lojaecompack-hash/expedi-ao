-- 1. Criar enum ProductionOperatorType
CREATE TYPE "ProductionOperatorType" AS ENUM ('CORTE_SOLDA', 'EXTRUSORA');

-- 2. Adicionar PRODUCAO ao enum UserRole
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'PRODUCAO';

-- 3. Adicionar PRODUCAO ao enum ModulePermission
ALTER TYPE "ModulePermission" ADD VALUE IF NOT EXISTS 'PRODUCAO';

-- 4. Criar tabela ProductionOperator
CREATE TABLE IF NOT EXISTS "ProductionOperator" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "type" "ProductionOperatorType" NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "passwordHash" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "userId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "ProductionOperator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 5. Criar índices
CREATE INDEX IF NOT EXISTS "ProductionOperator_userId_idx" ON "ProductionOperator"("userId");
CREATE INDEX IF NOT EXISTS "ProductionOperator_type_idx" ON "ProductionOperator"("type");

-- 6. Verificar estrutura
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'ProductionOperator'
ORDER BY ordinal_position;
