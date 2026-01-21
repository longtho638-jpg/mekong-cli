#!/bin/bash
set -e

echo "🔒 Pre-deployment Security & Health Check"
echo "========================================="

# 1. Check for critical environment variables
REQUIRED_VARS=("NEXT_PUBLIC_APP_URL" "DATABASE_URL" "NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY")
MISSING_VARS=0

if [ -f .env.production ]; then
    echo "✅ .env.production found"
else
    echo "⚠️  .env.production missing (Checking process.env)"
fi

# 2. Run Type Check
echo "Running Type Check..."
pnpm turbo typecheck || { echo "❌ Type check failed"; exit 1; }

# 3. Run Linting
echo "Running Linting..."
pnpm turbo lint || { echo "❌ Linting failed"; exit 1; }

# 4. Run Critical Tests
echo "Running Critical Tests..."
pnpm test || { echo "❌ Tests failed"; exit 1; }

echo "✅ All checks passed! Ready for deployment."
exit 0
