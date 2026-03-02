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
echo -e "${BLUE}║     AGI Algo Trader — Setup & Start          ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""

# ─── Step 1: Check prerequisites ─────────────────────────────────────────────
echo -e "${YELLOW}[1/6] Checking prerequisites...${NC}"

check_cmd() {
  if ! command -v "$1" &> /dev/null; then
    echo -e "${RED}ERROR: $1 is not installed. Please install it first.${NC}"
    echo "  $2"
    exit 1
  fi
  echo -e "  ${GREEN}✓${NC} $1 found"
}

check_cmd "node" "https://nodejs.org (v18+)"
check_cmd "docker" "https://docs.docker.com/get-docker/"
check_cmd "pnpm" "npm install -g pnpm"

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo -e "${RED}ERROR: Node.js v18+ required (found v${NODE_VERSION})${NC}"
  exit 1
fi

# ─── Step 2: Create .env from template ────────────────────────────────────────
echo ""
echo -e "${YELLOW}[2/6] Configuring environment...${NC}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

if [ ! -f .env ]; then
  cp .env.example .env
  echo -e "  ${GREEN}✓${NC} Created .env from template"
else
  echo -e "  ${GREEN}✓${NC} .env already exists"
fi

# ─── Step 3: Prompt for API keys ─────────────────────────────────────────────
echo ""
echo -e "${YELLOW}[3/6] Exchange API Keys${NC}"
echo "  Enter your exchange API keys (press Enter to skip any exchange):"
echo ""

update_env() {
  local key="$1"
  local value="$2"
  if [ -n "$value" ]; then
    if grep -q "^${key}=" .env; then
      sed -i.bak "s|^${key}=.*|${key}=${value}|" .env && rm -f .env.bak
    else
      echo "${key}=${value}" >> .env
    fi
  fi
}

# Binance
read -p "  Binance API Key (Enter to skip): " BINANCE_KEY
if [ -n "$BINANCE_KEY" ]; then
  read -p "  Binance Secret: " BINANCE_SEC
  update_env "BINANCE_API_KEY" "$BINANCE_KEY"
  update_env "BINANCE_SECRET" "$BINANCE_SEC"
  echo -e "  ${GREEN}✓${NC} Binance configured"
fi

# OKX
read -p "  OKX API Key (Enter to skip): " OKX_KEY
if [ -n "$OKX_KEY" ]; then
  read -p "  OKX Secret: " OKX_SEC
  update_env "OKX_API_KEY" "$OKX_KEY"
  update_env "OKX_SECRET" "$OKX_SEC"
  echo -e "  ${GREEN}✓${NC} OKX configured"
fi

# Bybit
read -p "  Bybit API Key (Enter to skip): " BYBIT_KEY
if [ -n "$BYBIT_KEY" ]; then
  read -p "  Bybit Secret: " BYBIT_SEC
  update_env "BYBIT_API_KEY" "$BYBIT_KEY"
  update_env "BYBIT_SECRET" "$BYBIT_SEC"
  echo -e "  ${GREEN}✓${NC} Bybit configured"
fi

# Telegram (optional)
echo ""
read -p "  Telegram Bot Token (Enter to skip): " TG_TOKEN
if [ -n "$TG_TOKEN" ]; then
  read -p "  Telegram Chat ID: " TG_CHAT
  update_env "TELEGRAM_BOT_TOKEN" "$TG_TOKEN"
  update_env "TELEGRAM_CHAT_ID" "$TG_CHAT"
  echo -e "  ${GREEN}✓${NC} Telegram alerts configured"
fi

# ─── Step 4: Install dependencies ────────────────────────────────────────────
echo ""
echo -e "${YELLOW}[4/6] Installing dependencies...${NC}"
pnpm install --frozen-lockfile 2>/dev/null || pnpm install
echo -e "  ${GREEN}✓${NC} Dependencies installed"

# ─── Step 5: Start infrastructure ────────────────────────────────────────────
echo ""
echo -e "${YELLOW}[5/6] Starting infrastructure (Docker)...${NC}"
if docker compose up -d 2>/dev/null; then
  echo -e "  ${GREEN}✓${NC} PostgreSQL, Redis, Prometheus, Grafana started"

  # Wait for DB
  echo "  Waiting for database..."
  sleep 3

  # Run migrations
  npx prisma generate 2>/dev/null && npx prisma migrate deploy 2>/dev/null
  echo -e "  ${GREEN}✓${NC} Database migrations applied"
else
  echo -e "  ${YELLOW}⚠${NC} Docker not running — skipping infrastructure"
  echo "  You can start later with: docker compose up -d"
fi

# ─── Step 6: Ready! ──────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          SETUP COMPLETE!                     ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Quick Start Commands:${NC}"
echo ""
echo "  # Dry-run arbitrage (safe, no real trades)"
echo "  pnpm dev arb:agi --exchanges binance,okx,bybit --symbols BTC/USDT,ETH/USDT"
echo ""
echo "  # Live arbitrage (REAL MONEY — be careful!)"
echo "  pnpm dev arb:agi --live --exchanges binance,okx --symbols BTC/USDT --size 0.01"
echo ""
echo "  # Backtest a strategy"
echo "  pnpm dev backtest -s RsiSma -d 30"
echo ""
echo "  # Start RaaS API server"
echo "  pnpm dev api:serve"
echo ""
echo -e "${BLUE}Monitoring:${NC}"
echo "  API Health:  http://localhost:3000/health"
echo "  Prometheus:  http://localhost:9090"
echo "  Grafana:     http://localhost:3001 (admin/admin)"
echo ""
echo -e "${YELLOW}Docs: docs/deployment-guide.md${NC}"
