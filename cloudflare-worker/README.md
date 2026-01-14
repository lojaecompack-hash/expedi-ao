# Cloudflare Worker - Tiny OAuth Proxy

Este Worker faz proxy das requisições OAuth para o Tiny ERP, contornando as restrições de rede da Vercel.

## Deploy

### 1. Criar conta no Cloudflare (gratuito)
- Acesse: https://dash.cloudflare.com/sign-up
- Crie uma conta gratuita

### 2. Criar Worker
1. Acesse: https://dash.cloudflare.com/
2. Clique em "Workers & Pages" no menu lateral
3. Clique em "Create Application"
4. Clique em "Create Worker"
5. Dê um nome: `tiny-oauth-proxy`
6. Clique em "Deploy"

### 3. Editar o código
1. Após o deploy, clique em "Edit Code"
2. Delete todo o código padrão
3. Cole o código do arquivo `tiny-oauth-proxy.js`
4. Clique em "Save and Deploy"

### 4. Copiar a URL do Worker
- A URL será algo como: `https://tiny-oauth-proxy.SEU-USUARIO.workers.dev`
- Copie essa URL

### 5. Configurar no projeto
- Adicione a variável de ambiente `TINY_OAUTH_PROXY_URL` na Vercel
- Valor: a URL do Worker que você copiou

## Teste

Teste o Worker fazendo uma requisição POST:

```bash
curl -X POST https://tiny-oauth-proxy.SEU-USUARIO.workers.dev \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "seu-client-id",
    "clientSecret": "seu-client-secret"
  }'
```

Deve retornar um JSON com `access_token`, `token_type` e `expires_in`.
