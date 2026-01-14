# 📦 Tiny Expedição - Sistema de Retirada de Pedidos

Sistema de gestão de retiradas de pedidos integrado com Tiny ERP e Supabase.

## 🚀 Stack Tecnológica

- **Framework:** Next.js 16 (App Router)
- **Database:** PostgreSQL (Supabase)
- **ORM:** Prisma 6
- **Auth:** Supabase Auth
- **Styling:** Tailwind CSS
- **Deploy:** Vercel

## 📋 Pré-requisitos

- Node.js 18+ 
- Conta Supabase (gratuita)
- Credenciais OAuth do Tiny ERP

## ⚙️ Setup Local

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/tiny-expedicao.git
cd tiny-expedicao
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo de exemplo e preencha com suas credenciais:

```bash
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais:

```env
# Supabase (obtenha em: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key

# Database (obtenha em: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/database)
# IMPORTANTE: Encode @ na senha como %40 (ex: @Pass123 vira %40Pass123)
DATABASE_URL=postgresql://postgres:SUA_SENHA@db.seu-projeto.supabase.co:5432/postgres

# Tiny ERP OAuth
TINY_CLIENT_ID=seu-client-id
TINY_CLIENT_SECRET=seu-client-secret

# Gere uma chave de criptografia:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
APP_ENCRYPTION_KEY=sua-chave-de-64-caracteres

# Email do admin (opcional)
BOOTSTRAP_ADMIN_EMAIL=seu-email@example.com
```

### 4. Configure o banco de dados

Execute as migrations SQL no Supabase SQL Editor:

```bash
# Copie e execute no Supabase SQL Editor:
# 1. prisma/migrations/20260113160000_rbac/migration.sql
# 2. prisma/migrations/20260113180000_tiny_settings/migration.sql
```

Depois gere o Prisma Client:

```bash
npm run db:push
```

### 5. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 🚢 Deploy na Vercel

### Deploy Automático (Recomendado)

1. **Conecte ao GitHub:**
   - Faça push do código para o GitHub
   - Acesse [vercel.com](https://vercel.com)
   - Clique em "Import Project"
   - Selecione seu repositório

2. **Configure as variáveis de ambiente:**
   - Na Vercel, vá em Settings → Environment Variables
   - Adicione todas as variáveis do `.env.example`
   - **IMPORTANTE:** Use a mesma `DATABASE_URL` do Supabase

3. **Deploy:**
   - A Vercel fará deploy automaticamente
   - Cada push para `main` = novo deploy
   - PRs geram preview deployments

### Deploy Manual

```bash
npm install -g vercel
vercel login
vercel --prod
```

## 📁 Estrutura do Projeto

```
tiny-expedicao/
├── src/
│   ├── app/                    # App Router (Next.js 16)
│   │   ├── api/               # API Routes
│   │   │   ├── session/       # Autenticação + RBAC
│   │   │   ├── settings/      # Configurações Tiny
│   │   │   └── tiny/          # OAuth Tiny ERP
│   │   ├── dashboard/         # Dashboard principal
│   │   ├── expedicao/         # Módulo de expedição
│   │   │   ├── retirada/      # Registro de retiradas
│   │   │   └── historico/     # Histórico
│   │   ├── settings/          # Configurações
│   │   └── login/             # Login
│   ├── components/            # Componentes React
│   │   └── AppLayout.tsx      # Layout com sidebar
│   └── lib/                   # Utilitários
│       ├── prisma.ts          # Prisma Client
│       ├── crypto.ts          # Criptografia
│       └── supabase/          # Supabase helpers
├── prisma/
│   ├── schema.prisma          # Schema do banco
│   └── migrations/            # Migrations SQL
├── .env.example               # Template de variáveis
├── vercel.json                # Configuração Vercel
└── package.json               # Dependências
```

## 🔐 RBAC (Controle de Acesso)

O sistema possui 3 níveis de permissão:

- **ADMIN:** Acesso total
- **SETTINGS:** Configurações do sistema
- **EXPEDICAO:** Módulo de expedição

O email definido em `BOOTSTRAP_ADMIN_EMAIL` recebe automaticamente todas as permissões.

## 🔧 Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run start        # Inicia servidor de produção
npm run lint         # Linter
npm run db:push      # Sincroniza schema com banco
npm run db:studio    # Abre Prisma Studio
```

## 🐛 Troubleshooting

### Erro de conexão ao banco (local)

Se você receber "Can't reach database server":

1. Verifique se o firewall está bloqueando portas 5432/6543
2. Confirme que a senha está URL-encoded (`@` = `%40`)
3. Teste a conexão no Supabase SQL Editor
4. **Nota:** Na Vercel, a conexão funciona normalmente

### Prisma Client não atualizado

```bash
npx prisma generate
```

### Build falha na Vercel

Verifique se todas as variáveis de ambiente estão configuradas corretamente na Vercel.

## 📝 Roadmap

- [x] Autenticação com Supabase
- [x] RBAC com Workspace/Membership
- [x] Layout com navegação
- [x] Settings do Tiny (criptografia)
- [ ] OAuth Tiny profissional (tokens no banco)
- [ ] Retirada com auditoria completa
- [ ] Histórico de retiradas
- [ ] Dashboard com métricas
- [ ] Notificações em tempo real

## 📄 Licença

MIT

## 🤝 Contribuindo

Pull requests são bem-vindos! Para mudanças maiores, abra uma issue primeiro.
