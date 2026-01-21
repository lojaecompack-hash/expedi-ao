-- ============================================
-- VERIFICAR E CORRIGIR USUÁRIO ADMIN
-- ============================================
-- Execute este script no Supabase do projeto de PRODUÇÃO (expedicaoecompack)
-- SQL Editor: https://supabase.com/dashboard/project/rlmjrholbksljnuevtcu/sql

-- 1. Verificar se o usuário existe
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
WHERE u.email = 'lojaecompack@gmail.com';

-- 2. Se o usuário existe mas não tem Membership, criar:
INSERT INTO "Membership" (
  id,
  "userId",
  "workspaceId",
  role,
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid(),
  u.id,
  w.id,
  'ADMIN',
  NOW(),
  NOW()
FROM "User" u
CROSS JOIN "Workspace" w
WHERE u.email = 'lojaecompack@gmail.com'
  AND w.name = 'Default'
  AND NOT EXISTS (
    SELECT 1 FROM "Membership" m 
    WHERE m."userId" = u.id AND m."workspaceId" = w.id
  );

-- 3. Atualizar role para ADMIN se necessário
UPDATE "User"
SET role = 'ADMIN',
    "updatedAt" = NOW()
WHERE email = 'lojaecompack@gmail.com'
  AND role != 'ADMIN';

-- 4. Verificar resultado final
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
WHERE u.email = 'lojaecompack@gmail.com';
