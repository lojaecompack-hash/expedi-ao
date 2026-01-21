-- ============================================
-- CRIAR USUÁRIO DE EXPEDIÇÃO NO BANCO DE PRODUÇÃO
-- ============================================
-- Execute este script no Supabase do projeto de PRODUÇÃO (expedicaoecompack)
-- SQL Editor: https://supabase.com/dashboard/project/rlmjlholksjlnuevtcu/sql

-- 1. Primeiro, pegue o UUID do usuário criado no Supabase Auth
-- Acesse: https://supabase.com/dashboard/project/rlmjlholksjlnuevtcu/auth/users
-- Copie o UUID do usuário expedicao@ecompack.com.br

-- 2. Substitua 'SEU_UUID_AQUI' pelo UUID copiado e execute:

INSERT INTO "User" (
  id,
  email,
  name,
  role,
  "createdAt",
  "updatedAt"
) VALUES (
  'SEU_UUID_AQUI',  -- ← COLE O UUID DO SUPABASE AUTH AQUI
  'expedicao@ecompack.com.br',
  'Expedição',
  'OPERATOR',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  "updatedAt" = NOW();

-- 3. Criar Membership (vínculo com workspace)
INSERT INTO "Membership" (
  id,
  "userId",
  "workspaceId",
  role,
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'SEU_UUID_AQUI',  -- ← MESMO UUID DO PASSO 2
  (SELECT id FROM "Workspace" WHERE name = 'Default' LIMIT 1),
  'OPERATOR',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- 4. Verificar se foi criado corretamente
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  m."workspaceId",
  w.name as workspace_name
FROM "User" u
LEFT JOIN "Membership" m ON m."userId" = u.id
LEFT JOIN "Workspace" w ON w.id = m."workspaceId"
WHERE u.email = 'expedicao@ecompack.com.br';

-- ============================================
-- INSTRUÇÕES:
-- ============================================
-- 1. Acesse: https://supabase.com/dashboard/project/rlmjlholksjlnuevtcu/auth/users
-- 2. Encontre o usuário: expedicao@ecompack.com.br
-- 3. Copie o UUID (exemplo: 123e4567-e89b-12d3-a456-426614174000)
-- 4. Cole o UUID nos lugares marcados com 'SEU_UUID_AQUI'
-- 5. Execute o script no SQL Editor do Supabase
-- 6. Teste o login em www.ecomlogic.com.br
