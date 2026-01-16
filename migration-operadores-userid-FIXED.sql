-- ============================================
-- MIGRAÇÃO CORRIGIDA: Adicionar userId aos Operadores
-- Data: 2026-01-16
-- Objetivo: Vincular operadores ao gestor logado
-- ============================================

-- PASSO 1: Adicionar coluna userId (NULLABLE para não quebrar dados existentes)
ALTER TABLE "Operator" 
ADD COLUMN IF NOT EXISTS "userId" TEXT;

-- PASSO 2: Criar índice para performance
CREATE INDEX IF NOT EXISTS "Operator_userId_idx" ON "Operator"("userId");

-- PASSO 3: OPCIONAL - Vincular operadores existentes ao admin master
-- Execute APENAS se quiser vincular operadores antigos ao admin
-- Substitua o email se necessário
UPDATE "Operator" 
SET "userId" = (
    SELECT id 
    FROM auth.users 
    WHERE email = 'lojaecompack@gmail.com' 
    LIMIT 1
)
WHERE "userId" IS NULL;

-- PASSO 4: Habilitar RLS (Row Level Security)
ALTER TABLE "Operator" ENABLE ROW LEVEL SECURITY;

-- PASSO 5: Remover políticas antigas se existirem (evita erro de duplicação)
DROP POLICY IF EXISTS "Users can view own operators or unassigned" ON "Operator";
DROP POLICY IF EXISTS "Users can create own operators" ON "Operator";
DROP POLICY IF EXISTS "Users can update own operators" ON "Operator";
DROP POLICY IF EXISTS "Users can delete own operators" ON "Operator";

-- PASSO 6: Criar política SELECT - Ver operadores próprios OU sem dono (NULL)
CREATE POLICY "Users can view own operators or unassigned"
ON "Operator" 
FOR SELECT
USING (
    auth.uid()::text = "userId" 
    OR "userId" IS NULL
);

-- PASSO 7: Criar política INSERT - Criar operadores vinculados a si mesmo
CREATE POLICY "Users can create own operators"
ON "Operator" 
FOR INSERT
WITH CHECK (auth.uid()::text = "userId");

-- PASSO 8: Criar política UPDATE - Atualizar apenas seus operadores
CREATE POLICY "Users can update own operators"
ON "Operator" 
FOR UPDATE
USING (
    auth.uid()::text = "userId" 
    OR "userId" IS NULL
);

-- PASSO 9: Criar política DELETE - Deletar apenas seus operadores
CREATE POLICY "Users can delete own operators"
ON "Operator" 
FOR DELETE
USING (
    auth.uid()::text = "userId" 
    OR "userId" IS NULL
);

-- ============================================
-- FIM DA MIGRAÇÃO
-- ============================================

-- VERIFICAÇÃO: Execute este SELECT para verificar se funcionou
SELECT id, name, "userId", "isActive" FROM "Operator" LIMIT 10;
