ALTER TABLE "Ocorrencia" ADD COLUMN IF NOT EXISTS "setorOrigem" TEXT;

ALTER TABLE "Ocorrencia" ADD COLUMN IF NOT EXISTS "setorDestino" TEXT;

ALTER TABLE "Ocorrencia" ADD COLUMN IF NOT EXISTS "statusOcorrencia" TEXT DEFAULT 'PENDENTE';

CREATE INDEX IF NOT EXISTS "Ocorrencia_setorDestino_idx" ON "Ocorrencia"("setorDestino");

CREATE INDEX IF NOT EXISTS "Ocorrencia_statusOcorrencia_idx" ON "Ocorrencia"("statusOcorrencia");

SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'Ocorrencia';
