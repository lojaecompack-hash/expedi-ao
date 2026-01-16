-- ============================================
-- CRIAR USUÁRIO EXPEDIÇÃO
-- Execute DEPOIS de criar o usuário no Supabase Auth
-- ============================================

-- PASSO 1: Criar usuário no Supabase Auth PRIMEIRO
-- Vá para: Authentication → Users → Add User
-- Email: expedicao@ecompack.com
-- Password: expedicao123 (ou outra senha)
-- Confirme o email automaticamente
-- COPIE O UUID GERADO (exemplo: 12345678-1234-1234-1234-123456789abc)

-- PASSO 2: Verificar estrutura da tabela User
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'User';

-- PASSO 3: Inserir na tabela User (SEM passwordHash)
-- SUBSTITUA 'UUID_DO_SUPABASE_AUTH' pelo UUID copiado no passo 1
INSERT INTO "User" (id, email, name, role, "createdAt", "updatedAt")
VALUES (
  'UUID_DO_SUPABASE_AUTH',
  'expedicao@ecompack.com',
  'Expedição',
  'EXPEDICAO',
  NOW(),
  NOW()
);

-- PASSO 4: Verificar se foi criado
SELECT id, email, name, role FROM "User" WHERE email = 'expedicao@ecompack.com';

-- ============================================
-- ALTERNATIVA: Se a tabela User tiver passwordHash
-- ============================================
-- Se o SELECT do PASSO 2 mostrar que existe passwordHash, use este:
/*
INSERT INTO "User" (id, email, name, role, "passwordHash", "createdAt", "updatedAt")
VALUES (
  'UUID_DO_SUPABASE_AUTH',
  'expedicao@ecompack.com',
  'Expedição',
  'EXPEDICAO',
  '',
  NOW(),
  NOW()
);
*/
