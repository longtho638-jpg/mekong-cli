-- CreateEnum
CREATE TYPE "DunningStatus" AS ENUM ('ACTIVE', 'GRACE_PERIOD', 'SUSPENDED', 'REVOKED');

-- CreateTable
CREATE TABLE "pnl_snapshots" (
    "id" BIGSERIAL NOT NULL,
    "tenantId" TEXT NOT NULL,
    "totalPnl" DECIMAL(12,2) NOT NULL,
    "realizedPnl" DECIMAL(12,2) NOT NULL,
    "unrealizedPnl" DECIMAL(12,2) NOT NULL,
    "openPositions" INTEGER NOT NULL DEFAULT 0,
    "equity" DECIMAL(12,2) NOT NULL,
    "snapshotAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pnl_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "licenses" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "tier" "Tier" NOT NULL,
    "tenantId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,

    CONSTRAINT "licenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "license_audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "licenseId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "tier" TEXT,
    "ip" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "license_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dunning_states" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "status" "DunningStatus" NOT NULL DEFAULT 'ACTIVE',
    "failedPayments" INTEGER NOT NULL DEFAULT 0,
    "currentPeriodEnd" TIMESTAMP(3),
    "gracePeriodDays" INTEGER NOT NULL DEFAULT 7,
    "suspendedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "lastPaymentFailedAt" TIMESTAMP(3),
    "lastPaymentRecoveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dunning_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dunning_events" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "severity" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dunning_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pnl_snapshots_tenantId_snapshotAt_idx" ON "pnl_snapshots"("tenantId", "snapshotAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "licenses_key_key" ON "licenses"("key");

-- CreateIndex
CREATE INDEX "licenses_key_idx" ON "licenses"("key");

-- CreateIndex
CREATE INDEX "licenses_tenantId_idx" ON "licenses"("tenantId");

-- CreateIndex
CREATE INDEX "licenses_status_idx" ON "licenses"("status");

-- CreateIndex
CREATE INDEX "license_audit_logs_licenseId_createdAt_idx" ON "license_audit_logs"("licenseId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "dunning_states_tenantId_key" ON "dunning_states"("tenantId");

-- CreateIndex
CREATE INDEX "dunning_states_status_idx" ON "dunning_states"("status");

-- CreateIndex
CREATE INDEX "dunning_states_tenantId_status_idx" ON "dunning_states"("tenantId", "status");

-- CreateIndex
CREATE INDEX "dunning_events_tenantId_createdAt_idx" ON "dunning_events"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "dunning_events_eventType_idx" ON "dunning_events"("eventType");
