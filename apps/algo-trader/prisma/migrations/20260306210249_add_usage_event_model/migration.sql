-- CreateTable
CREATE TABLE "usage_events" (
    "id" TEXT NOT NULL,
    "licenseKey" TEXT NOT NULL,
    "tenantId" TEXT,
    "eventType" TEXT NOT NULL,
    "units" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "usage_events_licenseKey_createdAt_idx" ON "usage_events"("licenseKey", "createdAt");

-- CreateIndex
CREATE INDEX "usage_events_tenantId_createdAt_idx" ON "usage_events"("tenantId", "createdAt");
