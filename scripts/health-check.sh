#!/usr/bin/env bash
# 🩺 Mekong CLI — Health Check
# Quick diagnostic: is this dev environment ready?

GREEN='\033[0;32m'; RED='\033[0;31m'; NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

PASS=0; FAIL=0

check() {
    local name="$1" cmd="$2" ver_cmd="$3"
    if eval "$cmd" &>/dev/null; then
        local ver; ver=$(eval "$ver_cmd" 2>/dev/null || echo "ok")
        printf "  ${GREEN}✅${NC} %-22s %s\n" "$name" "$ver"
        ((PASS++))
    else
        printf "  ${RED}❌${NC} %-22s %s\n" "$name" "missing"
        ((FAIL++))
    fi
}

echo ""
echo "🩺 Mekong CLI — Health Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check "Python 3.9+"       "python3 -c 'import sys; assert sys.version_info >= (3,9)'" "python3 --version"
check "Node.js 18+"       "node -e 'process.exit(+process.version.slice(1).split(\".\")[0] < 18)'" "node -v"
check "pnpm"              "command -v pnpm"    "pnpm -v"
check "Git"               "command -v git"     "git --version | cut -d' ' -f3"
check ".env file"         "test -f .env"       "echo exists"
check "CC CLI (claude)"   "command -v claude"  "claude --version 2>/dev/null || echo installed"
check "mekong command"    "command -v mekong"  "echo available"
check "pytest"            "python3 -m pytest --version" "python3 -m pytest --version 2>&1 | head -1"
check "~/.claude/settings" "test -f $HOME/.claude/settings.json" "echo configured"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Result: $PASS passed, $FAIL failed"
if [[ $FAIL -eq 0 ]]; then
    echo -e "  ${GREEN}🟢 All systems go!${NC}"
else
    echo -e "  ${RED}🔴 Fix the issues above, then run again.${NC}"
fi
echo ""
