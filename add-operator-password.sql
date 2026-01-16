-- Adicionar campo passwordHash na tabela Operator
ALTER TABLE "Operator" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT NOT NULL DEFAULT '';

-- Verificar estrutura
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'Operator'
ORDER BY ordinal_position;
