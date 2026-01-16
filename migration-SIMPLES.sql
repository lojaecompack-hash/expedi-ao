-- ============================================
-- MIGRAÇÃO SIMPLIFICADA - Operadores por Usuário
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- PASSO 1: Adicionar coluna userId
ALTER TABLE "Operator" 
ADD COLUMN IF NOT EXISTS "userId" TEXT;

-- PASSO 2: Criar índice
CREATE INDEX IF NOT EXISTS "Operator_userId_idx" ON "Operator"("userId");

-- PASSO 3: Vincular operadores existentes ao admin
UPDATE "Operator" 
SET "userId" = (
    SELECT id FROM auth.users WHERE email = 'lojaecompack@gmail.com' LIMIT 1
)
WHERE "userId" IS NULL;

-- PASSO 4: Habilitar RLS
ALTER TABLE "Operator" ENABLE ROW LEVEL SECURITY;

-- PASSO 5: Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Users can view own operators or unassigned" ON "Operator";
DROP POLICY IF EXISTS "Users can create own operators" ON "Operator";
DROP POLICY IF EXISTS "Users can update own operators" ON "Operator";
DROP POLICY IF EXISTS "Users can delete own operators" ON "Operator";

-- PASSO 6: Política SELECT
CREATE POLICY "Users can view own operators or unassigned"
ON "Operator" FOR SELECT
USING (auth.uid()::text = "userId" OR "userId" IS NULL);

-- PASSO 7: Política INSERT
CREATE POLICY "Users can create own operators"
ON "Operator" FOR INSERT
WITH CHECK (auth.uid()::text = "userId");

-- PASSO 8: Política UPDATE
CREATE POLICY "Users can update own operators"
ON "Operator" FOR UPDATE
USING (auth.uid()::text = "userId" OR "userId" IS NULL);

-- PASSO 9: Política DELETE
CREATE POLICY "Users can delete own operators"
ON "Operator" FOR DELETE
USING (auth.uid()::text = "userId" OR "userId" IS NULL);

-- VERIFICAÇÃO
SELECT id, name, "userId" FROM "Operator" LIMIT 10;
