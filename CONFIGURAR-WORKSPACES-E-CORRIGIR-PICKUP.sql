-- =====================================================
-- SCRIPT COMPLETO: Corrigir Pickup + Configurar Workspaces
-- Execute no Supabase SQL Editor
-- https://supabase.com/dashboard/project/tkwlbedfasvvtwnuvrej/sql
-- =====================================================

-- =====================================================
-- PARTE 1: CORRIGIR TABELA PICKUP
-- =====================================================

-- Adicionar coluna cpfLast4 na tabela Pickup
ALTER TABLE "Pickup" 
ADD COLUMN IF NOT EXISTS "cpfLast4" TEXT;

-- Verificar estrutura da tabela Pickup
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'Pickup'
ORDER BY ordinal_position;

-- =====================================================
-- PARTE 2: CONFIGURAR WORKSPACES
-- =====================================================

-- Limpar workspaces existentes (se houver)
DELETE FROM "TinySettings";
DELETE FROM "Membership";
DELETE FROM "Workspace";

-- Criar Workspace de PRODUÇÃO
INSERT INTO "Workspace" (id, name, "createdAt", "updatedAt")
VALUES (
  'ws-producao-' || gen_random_uuid()::text,
  'Produção',
  NOW(),
  NOW()
);

-- Criar Workspace de TESTE
INSERT INTO "Workspace" (id, name, "createdAt", "updatedAt")
VALUES (
  'ws-teste-' || gen_random_uuid()::text,
  'Teste',
  NOW(),
  NOW()
);

-- =====================================================
-- PARTE 3: VINCULAR ADMIN AOS WORKSPACES
-- =====================================================

-- Vincular admin ao workspace de PRODUÇÃO
INSERT INTO "Membership" (id, "workspaceId", "userId", permissions, "createdAt", "updatedAt")
SELECT 
  gen_random_uuid()::text,
  w.id,
  u.id,
  ARRAY['ADMIN', 'EXPEDICAO', 'PRODUCAO']::text[],
  NOW(),
  NOW()
FROM "User" u
CROSS JOIN "Workspace" w
WHERE u.email = 'lojaecompack@gmail.com'
  AND w.name = 'Produção';

-- Vincular admin ao workspace de TESTE
INSERT INTO "Membership" (id, "workspaceId", "userId", permissions, "createdAt", "updatedAt")
SELECT 
  gen_random_uuid()::text,
  w.id,
  u.id,
  ARRAY['ADMIN', 'EXPEDICAO', 'PRODUCAO']::text[],
  NOW(),
  NOW()
FROM "User" u
CROSS JOIN "Workspace" w
WHERE u.email = 'lojaecompack@gmail.com'
  AND w.name = 'Teste';

-- =====================================================
-- PARTE 4: CONFIGURAR TOKENS TINY (VOCÊ PRECISA PREENCHER)
-- =====================================================

-- IMPORTANTE: Substitua 'SEU_TOKEN_TINY_PRODUCAO' e 'SEU_TOKEN_TINY_TESTE' 
-- pelos tokens reais da API Tiny

-- Token de PRODUÇÃO
INSERT INTO "TinySettings" (id, "workspaceId", "apiTokenEncrypted", "isActive", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid()::text,
  w.id,
  'SEU_TOKEN_TINY_PRODUCAO',  -- <<<< SUBSTITUA AQUI
  true,
  NOW(),
  NOW()
FROM "Workspace" w
WHERE w.name = 'Produção';

-- Token de TESTE
INSERT INTO "TinySettings" (id, "workspaceId", "apiTokenEncrypted", "isActive", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid()::text,
  w.id,
  'SEU_TOKEN_TINY_TESTE',  -- <<<< SUBSTITUA AQUI
  true,
  NOW(),
  NOW()
FROM "Workspace" w
WHERE w.name = 'Teste';

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Ver workspaces criados
SELECT id, name, "createdAt"
FROM "Workspace"
ORDER BY name;

-- Ver memberships do admin
SELECT 
  m.id,
  w.name as workspace,
  u.email as usuario,
  m.permissions
FROM "Membership" m
JOIN "Workspace" w ON m."workspaceId" = w.id
JOIN "User" u ON m."userId" = u.id
ORDER BY w.name;

-- Ver configurações Tiny
SELECT 
  ts.id,
  w.name as workspace,
  SUBSTRING(ts."apiTokenEncrypted", 1, 20) || '...' as token_preview,
  ts."isActive"
FROM "TinySettings" ts
JOIN "Workspace" w ON ts."workspaceId" = w.id
ORDER BY w.name;
