-- ============================================
-- CRIAR USUÁRIO ADMIN NO BANCO DE PRODUÇÃO
-- ============================================
-- Execute este script no Supabase do projeto de PRODUÇÃO (expedicaoecompack)
-- SQL Editor: https://supabase.com/dashboard/project/rlmjrholbksljnuevtcu/sql

-- UUID do usuário lojaecompack@gmail.com (da imagem): 399fbd55-dd51-423d-bef7-6a8dc6c0ef5f

INSERT INTO "User" (
  id,
  email,
  name,
  "passwordHash",
  role,
  "createdAt",
  "updatedAt"
) VALUES (
  '399fbd55-dd51-423d-bef7-6a8dc6c0ef5f',
  'lojaecompack@gmail.com',
  'Administrador',
  'supabase_auth',
  'ADMIN',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  "updatedAt" = NOW();

-- Criar Membership (vínculo com workspace)
INSERT INTO "Membership" (
  id,
  "userId",
  "workspaceId",
  role,
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  '399fbd55-dd51-423d-bef7-6a8dc6c0ef5f',
  (SELECT id FROM "Workspace" WHERE name = 'Default' LIMIT 1),
  'ADMIN',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Verificar se foi criado corretamente
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
