-- ========================================
-- LIMPAR MÁQUINAS E ORDENS DE PRODUÇÃO
-- Execute este SQL no Supabase SQL Editor
-- ========================================

-- 1. Limpar currentOrderId de todas as máquinas
UPDATE "Machine" 
SET "currentOrderId" = NULL;

-- 2. Deletar todas as ordens de produção (CASCADE vai deletar tudo relacionado)
DELETE FROM "ProductionOrder";

-- 3. Verificar máquinas limpas
SELECT "id", "code", "name", "currentOrderId", "isActive"
FROM "Machine"
ORDER BY "code";

-- 4. Verificar se não há mais ordens
SELECT COUNT(*) as total_orders FROM "ProductionOrder";
SELECT COUNT(*) as total_bobinas FROM "ProductionBobina";
SELECT COUNT(*) as total_sessoes FROM "ProductionSession";
SELECT COUNT(*) as total_pacotes FROM "ProductionPackage";
SELECT COUNT(*) as total_aparas FROM "ProductionApara";
