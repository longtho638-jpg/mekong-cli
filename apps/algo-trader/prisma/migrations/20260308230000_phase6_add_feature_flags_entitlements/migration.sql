-- AlterTable
ALTER TABLE "licenses" ADD COLUMN "feature_flags" JSONB DEFAULT '{}',
ADD COLUMN "extension_eligibility" JSONB DEFAULT '{}',
ADD COLUMN "tier_extension" JSONB DEFAULT '{}';

-- CreateTable
CREATE TABLE "feature_flags" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "rollout_percentage" INTEGER NOT NULL DEFAULT 100,
    "user_whitelist" JSONB NOT NULL DEFAULT '[]',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "license_feature_flags" (
    "id" SERIAL NOT NULL,
    "license_id" TEXT NOT NULL,
    "feature_flag_id" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "override_value" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "license_feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extension_eligibility" (
    "id" SERIAL NOT NULL,
    "license_id" TEXT NOT NULL,
    "extension_name" TEXT NOT NULL,
    "eligible" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "usage_limit" INTEGER NOT NULL DEFAULT 1000,
    "reset_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "denied_at" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "extension_eligibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_analytics" (
    "id" SERIAL NOT NULL,
    "license_id" TEXT NOT NULL,
    "feature_flag" TEXT,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "request_count" INTEGER NOT NULL DEFAULT 0,
    "payload_size" BIGINT NOT NULL DEFAULT 0,
    "hour_bucket" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tier_extensions" (
    "id" TEXT NOT NULL,
    "license_id" TEXT NOT NULL,
    "requested_tier" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "denied_at" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tier_extensions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "feature_flags_enabled_idx" ON "feature_flags"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_name_key" ON "feature_flags"("name");

-- CreateIndex
CREATE INDEX "license_feature_flags_license_id_idx" ON "license_feature_flags"("license_id");

-- CreateIndex
CREATE INDEX "license_feature_flags_feature_flag_id_idx" ON "license_feature_flags"("feature_flag_id");

-- CreateIndex
CREATE UNIQUE INDEX "license_feature_flags_license_id_feature_flag_id_key" ON "license_feature_flags"("license_id", "feature_flag_id");

-- CreateIndex
CREATE INDEX "extension_eligibility_license_id_idx" ON "extension_eligibility"("license_id");

-- CreateIndex
CREATE INDEX "extension_eligibility_status_idx" ON "extension_eligibility"("status");

-- CreateIndex
CREATE UNIQUE INDEX "extension_eligibility_license_id_extension_name_key" ON "extension_eligibility"("license_id", "extension_name");

-- CreateIndex
CREATE INDEX "usage_analytics_license_id_idx" ON "usage_analytics"("license_id");

-- CreateIndex
CREATE INDEX "usage_analytics_hour_bucket_idx" ON "usage_analytics"("hour_bucket");

-- CreateIndex
CREATE UNIQUE INDEX "usage_analytics_license_id_feature_flag_endpoint_method_hour_bu_key" ON "usage_analytics"("license_id", "feature_flag", "endpoint", "method", "hour_bucket");

-- CreateIndex
CREATE INDEX "tier_extensions_license_id_idx" ON "tier_extensions"("license_id");

-- CreateIndex
CREATE INDEX "tier_extensions_status_idx" ON "tier_extensions"("status");

-- AddForeignKey
ALTER TABLE "license_feature_flags" ADD CONSTRAINT "license_feature_flags_license_id_fkey" FOREIGN KEY ("license_id") REFERENCES "licenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "license_feature_flags" ADD CONSTRAINT "license_feature_flags_feature_flag_id_fkey" FOREIGN KEY ("feature_flag_id") REFERENCES "feature_flags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extension_eligibility" ADD CONSTRAINT "extension_eligibility_license_id_fkey" FOREIGN KEY ("license_id") REFERENCES "licenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_analytics" ADD CONSTRAINT "usage_analytics_license_id_fkey" FOREIGN KEY ("license_id") REFERENCES "licenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tier_extensions" ADD CONSTRAINT "tier_extensions_license_id_fkey" FOREIGN KEY ("license_id") REFERENCES "licenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
