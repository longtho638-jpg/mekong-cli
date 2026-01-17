#!/bin/bash
# rollback.sh - AgencyOS Emergency Rollback Script
set -e

echo "🔄 Starting AgencyOS Emergency Rollback"

# Check if we have a previous version to rollback to
if [ ! -f ".previous-version" ]; then
    echo "❌ No previous version found for rollback"
    exit 1
fi

PREVIOUS_VERSION=$(cat .previous-version)
CURRENT_VERSION=$(git rev-parse HEAD)

echo "📊 Rolling back from: $CURRENT_VERSION"
echo "🎯 Rolling back to: $PREVIOUS_VERSION"

# Health check before rollback
echo "🏥 Pre-rollback health check..."
curl -f https://api.agencyos.network/api/health || {
    echo "⚠️  Current deployment already unhealthy, proceeding with rollback"
}

# Database rollback if needed
read -p "🗄️  Rollback database migrations? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔄 Rolling back database migrations..."
    npm run migrate:rollback
fi

# Git rollback
echo "🔄 Rolling back code to previous version..."
git checkout $PREVIOUS_VERSION

# Rebuild and deploy previous version
echo "📦 Rebuilding previous version..."
npm run build

echo "🚀 Redeploying previous version..."
npm run deploy:production

# Post-rollback health check
echo "🏥 Post-rollback health verification..."
sleep 30  # Allow deployment to stabilize

HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" https://api.agencyos.network/api/health)
if [ "$HEALTH_CHECK" = "200" ]; then
    echo "✅ Rollback successful! System is healthy."
    echo "📊 Current version: $(git rev-parse --short HEAD)"
else
    echo "❌ Rollback failed! System still unhealthy."
    echo "🚨 Manual intervention required!"
    exit 1
fi

# Save current problematic version for analysis
echo $CURRENT_VERSION > .failed-version

echo "📋 Rollback summary:"
echo "   Previous version: $PREVIOUS_VERSION"
echo "   Failed version: $CURRENT_VERSION"
echo "   Current version: $(git rev-parse --short HEAD)"
echo ""
echo "🔍 Investigate failed version in branch: feature/investigate-rollback-$(date +%Y%m%d-%H%M%S)"