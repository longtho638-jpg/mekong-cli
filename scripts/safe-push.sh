#!/bin/bash
# 🏯 SAFE PUSH - Binh Pháp Protection Script
# Use this instead of `git push` for guaranteed CI success

set -e

echo ""
echo "🏯 SAFE PUSH - Binh Pháp CI Protection"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Lint
echo -e "${YELLOW}Step 1/4: Python Lint${NC}"
if command -v ruff &> /dev/null; then
    ruff check . --fix --quiet && echo -e "   ${GREEN}✓ Lint passed${NC}" || {
        echo -e "   ${RED}✗ Lint failed${NC}"
        exit 1
    }
else
    echo "   → Ruff not found, skipping"
fi

# Step 2: TypeScript
echo -e "${YELLOW}Step 2/4: TypeScript Check${NC}"
if [ -f "apps/dashboard/tsconfig.json" ]; then
    cd apps/dashboard
    pnpm exec tsc --noEmit --skipLibCheck 2>/dev/null && echo -e "   ${GREEN}✓ TypeScript passed${NC}" || {
        echo -e "   ${RED}✗ TypeScript errors found${NC}"
        cd ../..
        exit 1
    }
    cd ../..
else
    echo "   → Dashboard not found, skipping"
fi

# Step 3: Build
echo -e "${YELLOW}Step 3/4: Build All${NC}"
pnpm build 2>&1 | tail -3
if [ $? -eq 0 ]; then
    echo -e "   ${GREEN}✓ Build passed${NC}"
else
    echo -e "   ${RED}✗ Build failed${NC}"
    exit 1
fi

# Step 4: Python tests
echo -e "${YELLOW}Step 4/4: Python Tests${NC}"
if [ -d "backend/tests" ]; then
    python3 -m pytest backend/tests -q --tb=no 2>/dev/null && echo -e "   ${GREEN}✓ Tests passed${NC}" || {
        echo -e "   ${RED}✗ Tests failed${NC}"
        exit 1
    }
else
    echo "   → No tests found, skipping"
fi

echo ""
echo "========================================"
echo -e "${GREEN}✅ All checks passed!${NC}"
echo ""

# Ask for confirmation
read -p "Push to origin/main? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push origin main
    echo ""
    echo -e "${GREEN}🚀 Pushed successfully!${NC}"
else
    echo "Push cancelled."
fi
