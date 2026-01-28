-- Adicionar coluna 'itens' na tabela Pickup para salvar os itens do pedido
-- Isso permite re-retiradas sem consultar a Tiny novamente

ALTER TABLE "Pickup" ADD COLUMN IF NOT EXISTS "itens" TEXT;

-- Verificar se a coluna foi criada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Pickup' AND column_name = 'itens';
