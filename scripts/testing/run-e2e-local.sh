#!/bin/bash
set -e

echo "🚀 Starting E2E Local Run..."

# Ensure deps are installed (optional check)
# npm install

# Start database/redis if using docker-compose
if [ -f "docker-compose.yml" ]; then
    echo "🐳 Starting services..."
    docker-compose up -d postgres redis || echo "⚠️  Docker compose failed or not present, continuing..."
fi

# Seed database
./scripts/testing/seed-test-db.sh

# Run tests
# Check if UI flag is passed
if [[ "$*" == *"--ui"* ]]; then
    echo "🖥️  Opening Playwright UI..."
    npx playwright test --ui
else
    echo "🏃 Running Playwright tests..."
    npx playwright test
fi

# Cleanup optional
# docker-compose down
