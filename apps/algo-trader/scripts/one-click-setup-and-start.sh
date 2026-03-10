#!/bin/bash
# =============================================================================
# AGI Algo Trader — One-Click Setup & Start
# Usage: ./scripts/one-click-setup-and-start.sh
# Customer only needs to provide exchange API keys — everything else auto-configures.
# =============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     AGI Algo Trader — One-Click Setup        ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""

# ─── Step 1: Check prerequisites ─────────────────────────────────────────────
echo -e "${YELLOW}[1/4] Checking prerequisites...${NC}"

check_cmd() {
  if ! command -v "$1" &> /dev/null; then
    echo -e "${RED}ERROR: $1 is not installed. Please install it first.${NC}"
    echo "  $2"
    exit 1
  fi
  echo -e "  ${GREEN}✓${NC} $1 found"
}

check_cmd "node" "https://nodejs.org (v18+)"

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo -e "${RED}ERROR: Node.js v18+ required (found v${NODE_VERSION})${NC}"
  exit 1
fi

# Detect package manager
if command -v pnpm &> /dev/null; then
  PKG_MGR="pnpm"
elif command -v npm &> /dev/null; then
  PKG_MGR="npm"
else
  echo -e "${RED}ERROR: npm or pnpm required${NC}"
  exit 1
fi
echo -e "  ${GREEN}✓${NC} Using $PKG_MGR"

# ─── Step 2: Install dependencies ────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

echo ""
echo -e "${YELLOW}[2/4] Installing dependencies...${NC}"
$PKG_MGR install 2>/dev/null || $PKG_MGR install --no-frozen-lockfile
echo -e "  ${GREEN}✓${NC} Dependencies installed"

# ─── Step 3: Interactive setup wizard (TypeScript CLI) ───────────────────────
echo ""
echo -e "${YELLOW}[3/4] Running setup wizard...${NC}"
npx ts-node src/index.ts setup

# ─── Step 4: Optional Docker infrastructure ──────────────────────────────────
echo ""
echo -e "${YELLOW}[4/4] Infrastructure (optional)...${NC}"

if command -v docker &> /dev/null; then
  echo -e "  Docker detected. Start PostgreSQL + Redis + Grafana? (y/N)"
  read -r START_DOCKER
  if [ "$START_DOCKER" = "y" ] || [ "$START_DOCKER" = "Y" ]; then
    if docker compose up -d 2>/dev/null; then
      echo -e "  ${GREEN}✓${NC} Infrastructure started"
      sleep 3
      npx prisma generate 2>/dev/null && npx prisma migrate deploy 2>/dev/null
      echo -e "  ${GREEN}✓${NC} Database migrations applied"
    else
      echo -e "  ${YELLOW}⚠${NC} Docker compose failed — skipping"
    fi
  else
    echo -e "  Skipped. Start later: docker compose up -d"
  fi
else
  echo -e "  ${YELLOW}ℹ${NC} Docker not found — backtest & dry-run still work without it"
fi

# ─── Done ─────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          SETUP COMPLETE! 🚀                  ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Run ${BLUE}npm run quickstart${NC} to verify everything works."
echo ""
echo -e "${BLUE}Commands:${NC}"
echo "  npm run quickstart                    # Demo backtest + status check"
echo "  npm run dev backtest                  # Full backtest"
echo "  npm run dev arb:agi                   # AGI arbitrage (recommended)"
echo "  npm run dev api:serve                 # Start RaaS API"
echo ""
echo -e "${YELLOW}Docs: docs/deployment-guide.md${NC}"
