-- Script para criar a tabela de Ocorrências
-- Execute este script no banco de dados PostgreSQL

-- Criar tabela Ocorrencia
CREATE TABLE IF NOT EXISTS "Ocorrencia" (
    "id" TEXT NOT NULL,
    "pickupId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ABERTO',
    "operadorId" TEXT,
    "operadorNome" TEXT,
    "resolvidoEm" TIMESTAMP(3),
    "resolvidoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ocorrencia_pkey" PRIMARY KEY ("id")
);

-- Criar índices
CREATE INDEX IF NOT EXISTS "Ocorrencia_pickupId_idx" ON "Ocorrencia"("pickupId");
CREATE INDEX IF NOT EXISTS "Ocorrencia_status_idx" ON "Ocorrencia"("status");

-- Adicionar foreign key
ALTER TABLE "Ocorrencia" ADD CONSTRAINT "Ocorrencia_pickupId_fkey" 
    FOREIGN KEY ("pickupId") REFERENCES "Pickup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Verificar se a tabela foi criada
SELECT 'Tabela Ocorrencia criada com sucesso!' as resultado;
