#!/bin/bash

# ==============================================================================
# AgencyOS Backend - Production Build Script
# ==============================================================================
# Usage: ./scripts/docker-build-backend.sh
#
# Builds the production Docker image for the backend service using the
# optimized multi-stage Dockerfile.
# ==============================================================================

set -e

# Configuration
IMAGE_NAME="agencyos-backend"
TAG="latest"
DOCKERFILE="backend/Dockerfile"
CONTEXT="."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Starting AgencyOS Backend Build...${NC}"

# 1. Validation
if [ ! -f "$DOCKERFILE" ]; then
    echo -e "${RED}❌ Error: Dockerfile not found at $DOCKERFILE${NC}"
    exit 1
fi

if [ ! -f "requirements.txt" ]; then
    echo -e "${RED}❌ Error: requirements.txt not found in root context${NC}"
    exit 1
fi

# 2. Build
echo -e "${GREEN}📦 Building Docker image: ${IMAGE_NAME}:${TAG}...${NC}"
echo -e "${YELLOW}ℹ️  Context: ${CONTEXT}${NC}"
echo -e "${YELLOW}ℹ️  Dockerfile: ${DOCKERFILE}${NC}"

# Use BuildKit for better performance and caching
export DOCKER_BUILDKIT=1

docker build \
    --file "$DOCKERFILE" \
    --tag "${IMAGE_NAME}:${TAG}" \
    --compress \
    "$CONTEXT"

# 3. Verification
echo -e "${GREEN}✅ Build complete!${NC}"
echo -e "${YELLOW}🔍 Verifying image size...${NC}"

SIZE=$(docker images "${IMAGE_NAME}:${TAG}" --format "{{.Size}}")
echo -e "Image Size: ${GREEN}${SIZE}${NC}"

echo -e "${GREEN}🎉 Backend build successful.${NC}"
echo -e "To run locally:"
echo -e "  docker run -p 8000:8000 ${IMAGE_NAME}:${TAG}"
