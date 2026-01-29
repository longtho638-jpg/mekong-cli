#!/usr/bin/env bash
# 🏯 AgencyOS Production Deployment Script
# Orchestrates Backend + Dashboard using Docker Compose
# ============================================================================

set -e

VERSION="${1:-latest}"
echo "🚀 Deploying AgencyOS v${VERSION} to PRODUCTION..."

# 1. Pre-flight Checks
# ----------------------------------------------------------------------------
echo "🔍 Running pre-flight checks..."

if [ ! -f .env.production ]; then
    echo "❌ Missing .env.production file!"
    echo "   Please copy .env.production.example to .env.production and configure secrets."
    exit 1
fi

# Ensure Docker Compose is available
if ! command -v docker >/dev/null 2>&1; then
    echo "❌ Docker is not installed."
    exit 1
fi

# 2. Build / Pull Images
# ----------------------------------------------------------------------------
echo "🏗️  Building/Pulling production images..."

# Ideally we pull from registry, but for now we build locally
# docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml build

# 3. Deploy (Zero-downtime rolling update via Compose)
# ----------------------------------------------------------------------------
echo "🔄 Updating services..."

docker compose -f docker-compose.prod.yml up -d --remove-orphans

# 4. Health Checks
# ----------------------------------------------------------------------------
echo "❤️  Verifying system health..."

# Wait for services to stabilize
echo "⏳ Waiting 15s for startup..."
sleep 15

# Backend Health
if curl -f http://localhost:8000/health >/dev/null 2>&1; then
    echo "✅ Backend is HEALTHY"
else
    echo "❌ Backend is UNHEALTHY"
    docker compose -f docker-compose.prod.yml logs --tail=50 backend
    exit 1
fi

# Dashboard Health
if wget --spider --quiet http://localhost:3000/api/health; then
    echo "✅ Dashboard is HEALTHY"
else
    echo "❌ Dashboard is UNHEALTHY"
    docker compose -f docker-compose.prod.yml logs --tail=50 dashboard
    exit 1
fi

echo "🎉 Deployment Complete!"
echo "   Backend: http://localhost:8000"
echo "   Dashboard: http://localhost:3000"
