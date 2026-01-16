-- ============================================
-- VERIFICAR E CORRIGIR WORKSPACE DO USUÁRIO EXPEDICAO
-- ============================================
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- 1. VERIFICAR WORKSPACE DEFAULT
SELECT 
  id,
  name,
  "userId",
  "createdAt"
FROM "Workspace"
WHERE name = 'Default';

-- 2. VERIFICAR USUÁRIOS
SELECT 
  id,
  email,
  name,
  role
FROM "User"
ORDER BY role, email;

-- 3. VERIFICAR MEMBERSHIPS (quem está vinculado ao workspace)
SELECT 
  m.id,
  m."workspaceId",
  m."userId",
  m.email,
  m.permissions,
  u.email as user_email,
  u.role as user_role,
  w.name as workspace_name
FROM "Membership" m
LEFT JOIN "User" u ON u.id = m."userId"
LEFT JOIN "Workspace" w ON w.id = m."workspaceId"
ORDER BY u.role, u.email;

-- 4. VERIFICAR TINY SETTINGS
SELECT 
  ts.id,
  ts."workspaceId",
  ts."isActive",
  ts."createdAt",
  w.name as workspace_name,
  LENGTH(ts."apiTokenEncrypted") as token_length
FROM "TinySettings" ts
LEFT JOIN "Workspace" w ON w.id = ts."workspaceId";

-- ============================================
-- CORREÇÃO: VINCULAR EXPEDICAO AO WORKSPACE
-- ============================================
-- Execute APENAS se o usuário EXPEDICAO não estiver vinculado

-- Passo 1: Buscar IDs necessários
DO $$
DECLARE
  v_workspace_id TEXT;
  v_user_id TEXT;
  v_user_email TEXT;
BEGIN
  -- Buscar workspace Default
  SELECT id INTO v_workspace_id
  FROM "Workspace"
  WHERE name = 'Default'
  LIMIT 1;
  
  -- Buscar usuário EXPEDICAO
  SELECT id, email INTO v_user_id, v_user_email
  FROM "User"
  WHERE role = 'EXPEDICAO'
  LIMIT 1;
  
  -- Verificar se encontrou
  IF v_workspace_id IS NULL THEN
    RAISE EXCEPTION 'Workspace Default não encontrado!';
  END IF;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário EXPEDICAO não encontrado!';
  END IF;
  
  RAISE NOTICE 'Workspace ID: %', v_workspace_id;
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'User Email: %', v_user_email;
  
  -- Criar ou atualizar membership
  INSERT INTO "Membership" (
    id,
    "workspaceId",
    "userId",
    email,
    permissions,
    "createdAt",
    "updatedAt"
  )
  VALUES (
    gen_random_uuid()::text,
    v_workspace_id,
    v_user_id,
    v_user_email,
    ARRAY['EXPEDICAO']::"ModulePermission"[],
    NOW(),
    NOW()
  )
  ON CONFLICT ("workspaceId", "userId") 
  DO UPDATE SET
    email = EXCLUDED.email,
    permissions = EXCLUDED.permissions,
    "updatedAt" = NOW();
  
  RAISE NOTICE 'Membership criado/atualizado com sucesso!';
END $$;

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

-- Verificar se EXPEDICAO agora está vinculado
SELECT 
  u.email,
  u.role,
  w.name as workspace,
  m.permissions,
  ts."isActive" as tiny_configured
FROM "User" u
LEFT JOIN "Membership" m ON m."userId" = u.id
LEFT JOIN "Workspace" w ON w.id = m."workspaceId"
LEFT JOIN "TinySettings" ts ON ts."workspaceId" = w.id
WHERE u.role = 'EXPEDICAO';

-- ============================================
-- RESULTADO ESPERADO:
-- ============================================
-- O usuário EXPEDICAO deve aparecer com:
-- - workspace: Default
-- - permissions: {EXPEDICAO}
-- - tiny_configured: true (se Tiny já foi configurado)
-- ============================================
