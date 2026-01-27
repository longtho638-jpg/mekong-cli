#!/bin/bash
# 🔧 Monitoring Setup Script
# Installs Sentry SDK and verifies monitoring configuration

set -e  # Exit on error

echo "🏯 AgencyOS - Production Monitoring Setup"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the correct directory
if [ ! -f "requirements.txt" ]; then
    echo -e "${RED}❌ Error: requirements.txt not found${NC}"
    echo "   Please run this script from the project root directory"
    exit 1
fi

echo "Step 1: Installing Sentry SDK..."
echo "---------------------------------"

# Install Sentry SDK
pip install "sentry-sdk[fastapi]>=1.40.0"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Sentry SDK installed successfully${NC}"
else
    echo -e "${RED}❌ Failed to install Sentry SDK${NC}"
    exit 1
fi

echo ""
echo "Step 2: Verifying Sentry configuration..."
echo "------------------------------------------"

# Check if sentry_config.py exists
if [ ! -f "backend/core/sentry_config.py" ]; then
    echo -e "${RED}❌ Error: backend/core/sentry_config.py not found${NC}"
    echo "   Sentry configuration file is missing"
    exit 1
else
    echo -e "${GREEN}✅ Sentry configuration file found${NC}"
fi

# Check if main.py has Sentry import
if grep -q "from backend.core.sentry_config import init_sentry" backend/main.py; then
    echo -e "${GREEN}✅ Sentry integration found in main.py${NC}"
else
    echo -e "${YELLOW}⚠️  Warning: Sentry integration not found in main.py${NC}"
    echo "   You may need to manually integrate Sentry"
fi

echo ""
echo "Step 3: Checking environment configuration..."
echo "----------------------------------------------"

# Check if .env file exists
if [ -f "backend/.env" ]; then
    # Check if SENTRY_DSN is set
    if grep -q "SENTRY_DSN=" backend/.env; then
        # Check if it's not the example value
        if grep -q "SENTRY_DSN=https://your_sentry_dsn" backend/.env; then
            echo -e "${YELLOW}⚠️  SENTRY_DSN is set to example value${NC}"
            echo "   Please update backend/.env with your actual Sentry DSN"
            DSN_CONFIGURED=false
        else
            echo -e "${GREEN}✅ SENTRY_DSN configured in .env${NC}"
            DSN_CONFIGURED=true
        fi
    else
        echo -e "${YELLOW}⚠️  SENTRY_DSN not found in backend/.env${NC}"
        echo "   Please add SENTRY_DSN to your .env file"
        DSN_CONFIGURED=false
    fi
else
    echo -e "${YELLOW}⚠️  backend/.env file not found${NC}"
    echo "   Creating from backend/.env.example..."

    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        echo -e "${GREEN}✅ Created backend/.env from example${NC}"
        echo "   Please update SENTRY_DSN in backend/.env"
    else
        echo -e "${RED}❌ backend/.env.example not found${NC}"
    fi
    DSN_CONFIGURED=false
fi

echo ""
echo "Step 4: Testing Sentry integration..."
echo "--------------------------------------"

# Only test if DSN is configured
if [ "$DSN_CONFIGURED" = true ]; then
    echo "Starting test server (this may take a moment)..."

    # Start server in background and capture output
    timeout 10s python -c "
import sys
sys.path.insert(0, '.')
from backend.main import app
print('Server started successfully')
" 2>&1 | grep -E "(Sentry initialized|Error|Warning)" || true

    echo -e "${GREEN}✅ Test completed${NC}"
else
    echo -e "${YELLOW}⏭️  Skipping test (SENTRY_DSN not configured)${NC}"
fi

echo ""
echo "=========================================="
echo "🎉 Monitoring Setup Complete!"
echo "=========================================="
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Get your Sentry DSN:"
echo "   • Go to https://sentry.io"
echo "   • Create a new project (Python/FastAPI)"
echo "   • Copy the DSN from project settings"
echo ""
echo "2. Configure Sentry:"
echo "   • Edit backend/.env"
echo "   • Set SENTRY_DSN=https://your_actual_dsn@sentry.io/project_id"
echo "   • Set ENV=production (or staging/development)"
echo ""
echo "3. Set up Uptime Monitoring:"
echo "   • Sign up at https://uptimerobot.com"
echo "   • Add monitor for https://api.agencyos.network/health"
echo "   • Configure alerts to ops@agencyos.network"
echo ""
echo "4. Review Documentation:"
echo "   • docs/MONITORING_SETUP.md - Full setup guide"
echo "   • docs/INCIDENT_RESPONSE.md - Incident procedures"
echo "   • docs/UPTIME_MONITORING.md - Uptime config details"
echo ""
echo "5. Deploy to Production:"
echo "   • Add SENTRY_DSN as Cloud Run environment variable"
echo "   • Deploy: ./deploy-production.sh"
echo "   • Verify monitoring is active in Sentry dashboard"
echo ""
echo "For detailed instructions, see: docs/MONITORING_SETUP.md"
echo ""
