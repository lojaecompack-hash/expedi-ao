-- ============================================
-- MIGRAÇÃO: Adicionar userId aos Operadores
-- Data: 2026-01-16
-- Objetivo: Vincular operadores ao gestor logado
-- ============================================

-- PASSO 1: Adicionar coluna userId (NULLABLE para não quebrar dados existentes)
ALTER TABLE "Operator" 
ADD COLUMN IF NOT EXISTS "userId" TEXT;

-- PASSO 2: Criar índice para performance
CREATE INDEX IF NOT EXISTS "Operator_userId_idx" ON "Operator"("userId");

-- PASSO 3: Criar foreign key para auth.users do Supabase
-- IMPORTANTE: Só execute se a tabela auth.users existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Operator_userId_fkey'
    ) THEN
        ALTER TABLE "Operator" 
        ADD CONSTRAINT "Operator_userId_fkey" 
        FOREIGN KEY ("userId") 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE;
    END IF;
END $$;

-- PASSO 4: OPCIONAL - Vincular operadores existentes ao admin master
-- Substitua 'lojaecompack@gmail.com' pelo email correto se necessário
UPDATE "Operator" 
SET "userId" = (
    SELECT id 
    FROM auth.users 
    WHERE email = 'lojaecompack@gmail.com' 
    LIMIT 1
)
WHERE "userId" IS NULL;

-- PASSO 5: Habilitar RLS (Row Level Security)
ALTER TABLE "Operator" ENABLE ROW LEVEL SECURITY;

-- PASSO 6: Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can view own operators or unassigned" ON "Operator";
DROP POLICY IF EXISTS "Users can create own operators" ON "Operator";
DROP POLICY IF EXISTS "Users can update own operators" ON "Operator";
DROP POLICY IF EXISTS "Users can delete own operators" ON "Operator";

-- PASSO 7: Criar política SELECT - Ver operadores próprios OU sem dono (NULL)
CREATE POLICY "Users can view own operators or unassigned"
ON "Operator" 
FOR SELECT
USING (auth.uid() = "userId" OR "userId" IS NULL);

-- PASSO 8: Criar política INSERT - Criar operadores vinculados a si mesmo
CREATE POLICY "Users can create own operators"
ON "Operator" 
FOR INSERT
WITH CHECK (auth.uid() = "userId");

-- PASSO 9: Criar política UPDATE - Atualizar apenas seus operadores
CREATE POLICY "Users can update own operators"
ON "Operator" 
FOR UPDATE
USING (auth.uid() = "userId");

-- PASSO 10: Criar política DELETE - Deletar apenas seus operadores
CREATE POLICY "Users can delete own operators"
ON "Operator" 
FOR DELETE
USING (auth.uid() = "userId");

-- ============================================
-- FIM DA MIGRAÇÃO
-- ============================================

-- VERIFICAÇÃO: Execute este SELECT para verificar se funcionou
-- SELECT id, name, "userId", "isActive" FROM "Operator";
