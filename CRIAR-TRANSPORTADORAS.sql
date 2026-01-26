-- =====================================================
-- CRIAR TABELA DE TRANSPORTADORAS PARA MATCH AUTOMÁTICO
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- Criar tabela Transportadora
CREATE TABLE IF NOT EXISTS "Transportadora" (
  "id" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "nomeDisplay" TEXT,
  "aliases" TEXT[] DEFAULT '{}',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Transportadora_pkey" PRIMARY KEY ("id")
);

-- Criar índice único no nome
CREATE UNIQUE INDEX IF NOT EXISTS "Transportadora_nome_key" ON "Transportadora"("nome");

-- Popular com as transportadoras da Tiny
INSERT INTO "Transportadora" ("id", "nome", "nomeDisplay", "aliases", "isActive", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'UBER', 'Uber', '{}', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'FLEX', 'Flex', '{}', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'FRENET', 'Frenet', '{}', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'CLIENTE RETIRA', 'Cliente Retira', '{"CLIENTE RETIRA | BRAS", "CLIENTE RETIRA | MOGI", "CLIENTE RETIRA | FÁBRICA"}', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'LALAMOVE', 'Lalamove', '{"LALAMOVE/99 - BRAS", "LALAMOVE/99 - MOGI", "Lalamove via frenet"}', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'GENEROSO', 'Generoso', '{"Generoso via frenet"}', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'CAMILO DOS SANTOS', 'Camilo dos Santos', '{}', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'LLS TRANSPORTES', 'LLS Transportes', '{}', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'LUZ TRANSPORTES', 'Luz Transportes', '{}', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'CAIAPO', 'Caiapó', '{}', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'TS CURSINO', 'TS Cursino', '{}', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'MEYVIS TRASPORTES', 'Meyvis Trasportes', '{}', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'GO FRETES', 'Go Fretes', '{"Go Fretes via frenet"}', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'VERA CRUZ', 'Vera Cruz', '{}', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'RISSO TRANSPORTES', 'Risso Transportes', '{}', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'TRANSPEROLA', 'Transpérola', '{}', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'TRANSMINAS', 'Transminas', '{"TRANS MINAS"}', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'TRANSPORTADORA MARCOS', 'Transportadora Marcos', '{}', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'SUICA TRANSPORTADORA', 'Suiça Transportadora', '{}', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'RODONAVES', 'Rodonaves', '{}', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'CORREIOS', 'Correios', '{"CORREIOS | MOGI", "CORREIOS | BRÁS", "CORREIO"}', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'KANGU', 'Kangu', '{}', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'PEX', 'PEX', '{}', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'JADLOG', 'Jadlog', '{"Jadlog via frenet", "Jadlog Promocional - SuperFrete", "SuperFrete - Jadlog Promocional"}', true, NOW(), NOW()),
  (gen_random_uuid()::text, '99', '99', '{"99 "}', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'TOTAL EXPRESS', 'Total Express', '{}', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'MERCADO ENVIOS', 'Mercado Envios', '{}', true, NOW(), NOW()),
  (gen_random_uuid()::text, 'OLIST ENVIOS', 'Olist Envios', '{}', true, NOW(), NOW())
ON CONFLICT ("nome") DO NOTHING;

-- Verificar resultado
SELECT * FROM "Transportadora" ORDER BY "nome";
