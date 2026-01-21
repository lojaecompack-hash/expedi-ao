-- Listar TODOS os usuários no banco de DESENVOLVIMENTO
-- Execute em: https://supabase.com/dashboard/project/tkwlbedfasvvtwnuvrej/sql

SELECT 
  id,
  email,
  name,
  role,
  "createdAt"
FROM "User"
ORDER BY "createdAt" DESC;
