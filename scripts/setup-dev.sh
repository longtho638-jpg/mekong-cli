#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# 🚀 MEKONG CLI — Developer Setup (Non-Interactive)
#
# Usage:
#   bash scripts/setup-dev.sh          # Full interactive setup
#   bash scripts/setup-dev.sh --quick  # Non-interactive (for AI agents / CI)
#
# What it does:
#   1. Copies .env.example → .env (if missing)
#   2. Installs Python deps (pip install -e ".[dev]")
#   3. Installs Node deps (pnpm install)
#   4. Sets up CC CLI settings template (if missing)
#   5. Runs health check
# =============================================================================

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

QUICK_MODE=false
[[ "${1:-}" == "--quick" ]] && QUICK_MODE=true

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

info()    { echo -e "${BLUE}[SETUP]${NC} $1"; }
success() { echo -e "${GREEN}[  OK ]${NC} $1"; }
warn()    { echo -e "${YELLOW}[WARN ]${NC} $1"; }
fail()    { echo -e "${RED}[FAIL]${NC} $1"; }

echo ""
echo "🐉 Mekong CLI — Developer Setup"
echo "================================"
echo ""

# --- Step 1: .env ---
if [[ ! -f "$PROJECT_ROOT/.env" ]]; then
    if [[ -f "$PROJECT_ROOT/.env.example" ]]; then
        cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
        success ".env created from .env.example"
        warn "Edit .env to add your real API keys"
    else
        warn ".env.example not found — skipping"
    fi
else
    success ".env already exists"
fi

# --- Step 2: Python deps ---
info "Installing Python dependencies..."
if command -v pip3 &>/dev/null; then
    pip3 install -e ".[dev]" --quiet 2>/dev/null && success "Python deps installed" || warn "Python install had warnings (non-fatal)"
elif command -v pip &>/dev/null; then
    pip install -e ".[dev]" --quiet 2>/dev/null && success "Python deps installed" || warn "Python install had warnings (non-fatal)"
else
    warn "pip not found — skip Python deps. Install Python 3.9+ first."
fi

# --- Step 3: Node deps ---
info "Installing Node dependencies..."
if command -v pnpm &>/dev/null; then
    pnpm install --frozen-lockfile 2>/dev/null && success "Node deps installed (pnpm)" || { pnpm install 2>/dev/null && success "Node deps installed (pnpm, no lockfile)"; }
elif command -v npm &>/dev/null; then
    npm install 2>/dev/null && success "Node deps installed (npm)"
else
    warn "Neither pnpm nor npm found — skip Node deps. Install Node 18+ first."
fi

# --- Step 4: CC CLI Settings Template ---
CLAUDE_SETTINGS="$HOME/.claude/settings.json"
CLAUDE_TEMPLATE="$PROJECT_ROOT/scripts/claude-settings.json.example"

if [[ ! -f "$CLAUDE_SETTINGS" ]] && [[ -f "$CLAUDE_TEMPLATE" ]]; then
    mkdir -p "$HOME/.claude"
    cp "$CLAUDE_TEMPLATE" "$CLAUDE_SETTINGS"
    success "CC CLI settings created at ~/.claude/settings.json"
    warn "Edit ~/.claude/settings.json to add your DashScope API key"
    if [[ "$QUICK_MODE" == false ]]; then
        echo ""
        echo -e "${YELLOW}Enter your DashScope API key (or press Enter to skip):${NC}"
        read -r DS_KEY
        if [[ -n "$DS_KEY" ]]; then
            # Replace placeholder with real key using sed
            if [[ "$(uname)" == "Darwin" ]]; then
                sed -i '' "s/YOUR_DASHSCOPE_KEY_HERE/$DS_KEY/g" "$CLAUDE_SETTINGS"
            else
                sed -i "s/YOUR_DASHSCOPE_KEY_HERE/$DS_KEY/g" "$CLAUDE_SETTINGS"
            fi
            success "DashScope key configured in ~/.claude/settings.json"
        else
            warn "Skipped — edit ~/.claude/settings.json later"
        fi
    fi
elif [[ -f "$CLAUDE_SETTINGS" ]]; then
    success "CC CLI settings already exist"
else
    warn "No .claude/settings.json.example template found"
fi

# --- Step 5: Health Check ---
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  HEALTH CHECK"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check() {
    local name="$1" cmd="$2"
    if eval "$cmd" &>/dev/null; then
        local ver
        ver=$(eval "$3" 2>/dev/null || echo "installed")
        printf "  %-20s %s\n" "✅ $name" "$ver"
    else
        printf "  %-20s %s\n" "❌ $name" "not found"
    fi
}

check "Python"    "command -v python3"     "python3 --version 2>&1 | head -1"
check "Node.js"   "command -v node"        "node -v"
check "pnpm"      "command -v pnpm"        "pnpm -v"
check "Git"       "command -v git"         "git --version"
check ".env"      "test -f .env"           "echo 'exists'"
check "CC CLI"    "command -v claude"      "claude --version 2>/dev/null || echo 'installed'"
check "mekong"    "command -v mekong"      "echo 'available'"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# --- LLM Provider Check ---
if grep -q "YOUR_DASHSCOPE_KEY_HERE\|sk-your-api-key\|your-.*-key" .env 2>/dev/null; then
    echo ""
    warn "API keys still have placeholder values in .env"
    echo "  Edit .env and set at minimum:"
    echo "    LLM_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1"
    echo "    LLM_API_KEY=sk-..."
    echo ""
    echo "  🎁 Free Qwen credits: https://www.alibabacloud.com/campaign/benefits?referral_code=A9245T"
fi

echo ""
success "Setup complete! Run 'make test' to verify."
echo ""
