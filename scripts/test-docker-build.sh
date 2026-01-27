#!/bin/bash
# ============================================================================
# AgencyOS Docker Build Test Script
# Tests the production Docker image build and health
# ============================================================================

set -e  # Exit on error

echo "🏗️  Building AgencyOS Production Docker Image..."
echo "================================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Build production image
echo -e "\n${YELLOW}Step 1: Building production image (runtime stage)${NC}"
docker build \
    --target runtime \
    --tag agencyos-backend:latest \
    --tag agencyos-backend:$(date +%Y%m%d-%H%M%S) \
    --build-arg BUILDKIT_INLINE_CACHE=1 \
    .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Production image built successfully${NC}"
else
    echo -e "${RED}✗ Production build failed${NC}"
    exit 1
fi

# Build development image
echo -e "\n${YELLOW}Step 2: Building development image${NC}"
docker build \
    --target development \
    --tag agencyos-backend:dev \
    .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Development image built successfully${NC}"
else
    echo -e "${RED}✗ Development build failed${NC}"
    exit 1
fi

# Check image size
echo -e "\n${YELLOW}Step 3: Checking image sizes${NC}"
docker images agencyos-backend --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

# Test production container
echo -e "\n${YELLOW}Step 4: Testing production container${NC}"
CONTAINER_ID=$(docker run -d \
    -p 8000:8000 \
    -e ENVIRONMENT=test \
    -e SECRET_KEY=test-key \
    --name agencyos-test \
    agencyos-backend:latest)

echo "Container started: $CONTAINER_ID"

# Wait for container to be healthy
echo "Waiting for container to be healthy..."
sleep 10

# Check health endpoint
echo "Testing health endpoint..."
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health)

if [ "$HEALTH_CHECK" -eq 200 ]; then
    echo -e "${GREEN}✓ Health check passed (HTTP $HEALTH_CHECK)${NC}"
else
    echo -e "${RED}✗ Health check failed (HTTP $HEALTH_CHECK)${NC}"
    docker logs agencyos-test
    docker stop agencyos-test
    docker rm agencyos-test
    exit 1
fi

# Test root endpoint
echo "Testing root endpoint..."
ROOT_CHECK=$(curl -s http://localhost:8000/)
echo "Response: $ROOT_CHECK"

# Cleanup
echo -e "\n${YELLOW}Step 5: Cleaning up test container${NC}"
docker stop agencyos-test
docker rm agencyos-test

echo -e "\n${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ All Docker build tests passed!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo "Available images:"
docker images agencyos-backend
echo ""
echo "To run production image:"
echo "  docker run -p 8000:8000 agencyos-backend:latest"
echo ""
echo "To run development image:"
echo "  docker run -p 8000:8000 -v \$(pwd):/app agencyos-backend:dev"
echo ""
