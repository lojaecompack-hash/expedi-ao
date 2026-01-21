-- Verificar e corrigir usuário no banco de DESENVOLVIMENTO
-- Execute em: https://supabase.com/dashboard/project/tkwlbedfasvvtwnuvrej/sql

-- 1. Atualizar role para ADMIN
UPDATE "User"
SET role = 'ADMIN',
    "updatedAt" = NOW()
WHERE email = 'lojaecompack@gmail.com';

-- 2. Criar Membership se não existir
INSERT INTO "Membership" (
  id,
  "userId",
  "workspaceId",
  permissions,
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid(),
  u.id,
  w.id,
  ARRAY['ADMIN', 'SETTINGS', 'EXPEDICAO', 'PRODUCAO']::"ModulePermission"[],
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

-- 3. Verificar resultado
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  m.permissions,
  w.name as workspace_name
FROM "User" u
LEFT JOIN "Membership" m ON m."userId" = u.id
LEFT JOIN "Workspace" w ON w.id = m."workspaceId"
WHERE u.email = 'lojaecompack@gmail.com';
