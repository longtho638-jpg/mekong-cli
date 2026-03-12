-- CreateTable
CREATE TABLE "polymarket_positions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "size" DECIMAL(65,30) NOT NULL,
    "avgPrice" DECIMAL(65,30) NOT NULL,
    "realizedPnl" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "polymarket_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "polymarket_orders" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "size" DECIMAL(65,30) NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "orderType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "filledAt" TIMESTAMP(3),

    CONSTRAINT "polymarket_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kalshi_positions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "count" DECIMAL(65,30) NOT NULL,
    "avgPrice" DECIMAL(65,30) NOT NULL,
    "realizedPnl" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "kalshi_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "binance_listing_alerts" (
    "id" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "signalId" TEXT,

    CONSTRAINT "binance_listing_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "polymarket_positions_tenantId_tokenId_idx" ON "polymarket_positions"("tenantId", "tokenId");

-- CreateIndex
CREATE INDEX "polymarket_orders_tenantId_orderId_idx" ON "polymarket_orders"("tenantId", "orderId");

-- CreateIndex
CREATE INDEX "kalshi_positions_tenantId_ticker_idx" ON "kalshi_positions"("tenantId", "ticker");

-- CreateIndex
CREATE INDEX "binance_listing_alerts_ticker_detectedAt_idx" ON "binance_listing_alerts"("ticker", "detectedAt");

-- CreateIndex
CREATE UNIQUE INDEX "polymarket_orders_orderId_key" ON "polymarket_orders"("orderId");
