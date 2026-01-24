#!/usr/bin/env bash
# 🏯 AgencyOS Production Deployment Script
# This script is called by cc_release.py during production deployment

set -e

VERSION="${1:-latest}"
DOCKER_IMAGE="agencyos/mekong-cli:${VERSION}"

echo "🚀 Deploying AgencyOS v${VERSION} to PRODUCTION..."
echo "⚠️  Production deployment - safety checks enabled"

# Pre-deployment health checks
echo "🔍 Running pre-deployment checks..."

# Check if Docker image exists
if ! docker pull ${DOCKER_IMAGE}; then
    echo "❌ Docker image ${DOCKER_IMAGE} not found!"
    exit 1
fi

# Check database connectivity (customize as needed)
# echo "🗄️  Checking database connectivity..."
# if ! pg_isready -h production-db.example.com -p 5432; then
#     echo "❌ Database not accessible!"
#     exit 1
# fi

echo "✅ Pre-deployment checks passed"

# Blue-Green Deployment Strategy
echo "🔵 Starting blue-green deployment..."

# Option 1: Docker with zero-downtime
echo "🐳 Deploying with zero-downtime strategy..."

# Start new container (green)
docker pull ${DOCKER_IMAGE}
docker run -d \
    --name agencyos-production-new \
    --restart unless-stopped \
    -p 8081:8080 \
    -e ENV=production \
    ${DOCKER_IMAGE}

# Wait for new container to be healthy
echo "⏳ Waiting for new container to be healthy..."
sleep 10

# Health check
if ! curl -f http://localhost:8081/health 2>/dev/null; then
    echo "❌ New container health check failed!"
    docker stop agencyos-production-new
    docker rm agencyos-production-new
    exit 1
fi

echo "✅ New container is healthy"

# Switch traffic (update load balancer or swap ports)
echo "🔄 Switching traffic to new container..."

# Stop old container
docker stop agencyos-production 2>/dev/null || true
docker rm agencyos-production 2>/dev/null || true

# Rename new container
docker rename agencyos-production-new agencyos-production

# Update port mapping if needed
# docker stop agencyos-production
# docker run -d \
#     --name agencyos-production \
#     --restart unless-stopped \
#     -p 8080:8080 \
#     -e ENV=production \
#     ${DOCKER_IMAGE}

# Option 2: Kubernetes (uncomment and customize)
# echo "☸️  Deploying to Kubernetes production namespace..."
# kubectl set image deployment/agencyos agencyos=${DOCKER_IMAGE} -n production
# kubectl rollout status deployment/agencyos -n production
# echo "ℹ️  Kubernetes deployment completed"

# Option 3: Cloud Platform deployment
# Example for AWS ECS:
# aws ecs update-service --cluster production --service agencyos --force-new-deployment

# Post-deployment verification
echo "🔍 Running post-deployment checks..."

# Verify deployment
if docker ps | grep agencyos-production; then
    echo "✅ Production deployment successful!"
else
    echo "❌ Production deployment verification failed!"
    exit 1
fi

# Send deployment notification (customize)
# curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
#     -H 'Content-Type: application/json' \
#     -d "{\"text\": \"🚀 AgencyOS v${VERSION} deployed to production\"}"

echo "✅ Production deployment complete!"
echo "📊 Container status:"
docker ps | grep agencyos-production

echo ""
echo "💡 Rollback command if needed:"
echo "   cc release rollback"
