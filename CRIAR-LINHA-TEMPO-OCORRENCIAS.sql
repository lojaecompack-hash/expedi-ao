-- Script para criar o sistema de Linhas do Tempo de Ocorrências
-- Execute este script no banco de dados PostgreSQL

-- 1. Criar tabela LinhaTempoOcorrencia
CREATE TABLE IF NOT EXISTS "LinhaTempoOcorrencia" (
    "id" TEXT NOT NULL,
    "pickupId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ABERTA',
    "encerradoEm" TIMESTAMP(3),
    "encerradoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LinhaTempoOcorrencia_pkey" PRIMARY KEY ("id")
);

-- 2. Criar índices para LinhaTempoOcorrencia
CREATE INDEX IF NOT EXISTS "LinhaTempoOcorrencia_pickupId_idx" ON "LinhaTempoOcorrencia"("pickupId");
CREATE INDEX IF NOT EXISTS "LinhaTempoOcorrencia_status_idx" ON "LinhaTempoOcorrencia"("status");

-- 3. Adicionar foreign key para LinhaTempoOcorrencia
ALTER TABLE "LinhaTempoOcorrencia" ADD CONSTRAINT "LinhaTempoOcorrencia_pickupId_fkey" 
    FOREIGN KEY ("pickupId") REFERENCES "Pickup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. Modificar tabela Ocorrencia existente
-- Primeiro, remover a foreign key antiga se existir
ALTER TABLE "Ocorrencia" DROP CONSTRAINT IF EXISTS "Ocorrencia_pickupId_fkey";

-- 5. Adicionar coluna linhaTempoId se não existir
ALTER TABLE "Ocorrencia" ADD COLUMN IF NOT EXISTS "linhaTempoId" TEXT;

-- 6. Remover colunas antigas que não serão mais usadas
ALTER TABLE "Ocorrencia" DROP COLUMN IF EXISTS "pickupId";
ALTER TABLE "Ocorrencia" DROP COLUMN IF EXISTS "status";
ALTER TABLE "Ocorrencia" DROP COLUMN IF EXISTS "operadorId";
ALTER TABLE "Ocorrencia" DROP COLUMN IF EXISTS "resolvidoEm";
ALTER TABLE "Ocorrencia" DROP COLUMN IF EXISTS "resolvidoPor";

-- 7. Remover índices antigos
DROP INDEX IF EXISTS "Ocorrencia_pickupId_idx";
DROP INDEX IF EXISTS "Ocorrencia_status_idx";

-- 8. Criar índice para linhaTempoId
CREATE INDEX IF NOT EXISTS "Ocorrencia_linhaTempoId_idx" ON "Ocorrencia"("linhaTempoId");

-- 9. Adicionar foreign key para Ocorrencia -> LinhaTempoOcorrencia
-- Nota: Só executar depois de popular a coluna linhaTempoId
-- ALTER TABLE "Ocorrencia" ADD CONSTRAINT "Ocorrencia_linhaTempoId_fkey" 
--     FOREIGN KEY ("linhaTempoId") REFERENCES "LinhaTempoOcorrencia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Verificar se as tabelas foram criadas
SELECT 'Tabela LinhaTempoOcorrencia criada com sucesso!' as resultado;
