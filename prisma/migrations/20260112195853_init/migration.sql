-- CreateEnum
CREATE TYPE "InternalOrderStatus" AS ENUM ('NOVO', 'EMBALADO', 'RETIRADO');

-- CreateEnum
CREATE TYPE "SyncJobType" AS ENUM ('MARK_AS_SHIPPED');

-- CreateEnum
CREATE TYPE "SyncJobStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "tinyOrderId" TEXT NOT NULL,
    "orderNumber" TEXT,
    "customerName" TEXT,
    "customerCpfHash" TEXT,
    "statusTiny" TEXT,
    "statusInterno" "InternalOrderStatus" NOT NULL DEFAULT 'NOVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pickup" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "cpfLast4" TEXT,
    "operator" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pickup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncJob" (
    "id" TEXT NOT NULL,
    "type" "SyncJobType" NOT NULL,
    "status" "SyncJobStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "orderId" TEXT,
    "payload" JSONB,
    "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_tinyOrderId_key" ON "Order"("tinyOrderId");

-- CreateIndex
CREATE INDEX "Order_customerCpfHash_idx" ON "Order"("customerCpfHash");

-- CreateIndex
CREATE INDEX "Order_statusInterno_idx" ON "Order"("statusInterno");

-- CreateIndex
CREATE INDEX "Pickup_orderId_idx" ON "Pickup"("orderId");

-- CreateIndex
CREATE INDEX "SyncJob_status_idx" ON "SyncJob"("status");

-- CreateIndex
CREATE INDEX "SyncJob_scheduledAt_idx" ON "SyncJob"("scheduledAt");

-- AddForeignKey
ALTER TABLE "Pickup" ADD CONSTRAINT "Pickup_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncJob" ADD CONSTRAINT "SyncJob_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
