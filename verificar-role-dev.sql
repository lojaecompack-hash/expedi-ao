-- Verificar role atual do usuário no banco DEV
-- Execute em: https://supabase.com/dashboard/project/tkwlbedfasvvtwnuvrej/sql

SELECT 
  id,
  email,
  name,
  role,
  "createdAt"
FROM "User"
WHERE email = 'lojaecompack@gmail.com';
