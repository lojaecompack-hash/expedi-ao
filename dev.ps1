# Script para rodar em desenvolvimento com variáveis corretas
# Execute: .\dev.ps1

# Forçar variáveis de desenvolvimento
$env:DATABASE_URL = "postgresql://postgres:ecompack2026@db.tkwlbedfasvvtwnuvrej.supabase.co:6543/postgres?pgbouncer=true"
$env:NEXT_PUBLIC_SUPABASE_URL = "https://tkwlbedfasvvtwnuvrej.supabase.co"

Write-Host "Variáveis de ambiente configuradas para DESENVOLVIMENTO" -ForegroundColor Green
Write-Host "DATABASE_URL aponta para: tkwlbedfasvvtwnuvrej (DEV)" -ForegroundColor Yellow

# Iniciar servidor
npm run dev
