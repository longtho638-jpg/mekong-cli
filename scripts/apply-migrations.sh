#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# 🚀 AgencyOS - Apply All Migrations
# Run this script to set up the database for VC demo
# ═══════════════════════════════════════════════════════════════════════════════

set -e

echo "🏦 AgencyOS Database Migration Script"
echo "======================================"
echo ""

# Check for Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "⚠️  Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Check for environment
if [ -z "$SUPABASE_PROJECT_REF" ]; then
    echo "❌ Error: SUPABASE_PROJECT_REF not set"
    echo "   Set it with: export SUPABASE_PROJECT_REF=your-project-ref"
    exit 1
fi

if [ -z "$SUPABASE_DB_PASSWORD" ]; then
    echo "❌ Error: SUPABASE_DB_PASSWORD not set"
    echo "   Set it with: export SUPABASE_DB_PASSWORD=your-db-password"
    exit 1
fi

echo "📦 Applying migrations..."
echo ""

# Migration order matters!
MIGRATIONS=(
    "20260105_billing_schema.sql"
    "20260105_multi_tenancy_schema.sql"
    "20260105_analytics_schema.sql"
)

for migration in "${MIGRATIONS[@]}"; do
    echo "⏳ Applying: $migration"
    
    # Using Supabase CLI
    supabase db push --db-url "postgresql://postgres:${SUPABASE_DB_PASSWORD}@db.${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres" \
        --include-seed=false \
        supabase/migrations/$migration
    
    echo "✅ Applied: $migration"
    echo ""
done

echo "🎉 All migrations applied successfully!"
echo ""
echo "📊 Tables created:"
echo "   - subscriptions, invoices, payments (Billing)"
echo "   - tenants, tenant_members, tenant_branding (Multi-Tenancy)"
echo "   - usage_events, sessions, daily_metrics (Analytics)"
echo ""
echo "🔐 RLS policies enabled on all tables"
echo ""
echo "Next steps:"
echo "   1. Configure API keys in .env.local"
echo "   2. Run: npm run dev"
echo "   3. Visit: http://localhost:3000/pricing"
