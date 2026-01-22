# Atualizar .env.local com URL correta do banco DEV

## Acesse o Supabase DEV:
https://supabase.com/dashboard/project/tkwlbedfasvvtwnuvrej/settings/database

## Copie a Connection String:
1. Vá em "Connection string"
2. Selecione "Transaction pooler" (porta 6543)
3. Clique em "URI"
4. Substitua [YOUR-PASSWORD] pela senha que você criou

## Formato correto (novo):
```
postgresql://postgres.tkwlbedfasvvtwnuvrej:[SUA-SENHA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
```

## Formato antigo (pode não funcionar):
```
postgresql://postgres:[SUA-SENHA]@db.tkwlbedfasvvtwnuvrej.supabase.co:6543/postgres?pgbouncer=true
```
