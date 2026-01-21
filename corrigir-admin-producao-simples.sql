-- ============================================
-- CORRIGIR USUÁRIO ADMIN - PRODUÇÃO
-- ============================================
-- Execute no Supabase PRODUÇÃO: https://supabase.com/dashboard/project/rlmjrholbksljnuevtcu/sql

-- UUID do lojaecompack@gmail.com em PRODUÇÃO: 399fbd55-dd51-423d-bef7-6a8dc6c0ef5f

-- 1. Atualizar role para ADMIN
UPDATE "User"
SET role = 'ADMIN',
    "updatedAt" = NOW()
WHERE id = '399fbd55-dd51-423d-bef7-6a8dc6c0ef5f';

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
  '399fbd55-dd51-423d-bef7-6a8dc6c0ef5f',
  w.id,
  ARRAY['ADMIN', 'SETTINGS', 'EXPEDICAO', 'PRODUCAO']::"ModulePermission"[],
  NOW(),
  NOW()
FROM "Workspace" w
WHERE w.name = 'Default'
  AND NOT EXISTS (
    SELECT 1 FROM "Membership" m 
    WHERE m."userId" = '399fbd55-dd51-423d-bef7-6a8dc6c0ef5f'
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
WHERE u.id = '399fbd55-dd51-423d-bef7-6a8dc6c0ef5f';
