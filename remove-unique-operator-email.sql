-- Remover constraint UNIQUE do campo email da tabela Operator
-- Isso permite criar múltiplos operadores sem email (NULL)

ALTER TABLE "Operator" DROP CONSTRAINT IF EXISTS "Operator_email_key";
