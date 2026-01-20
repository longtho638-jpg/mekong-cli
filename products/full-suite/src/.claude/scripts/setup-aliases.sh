#!/bin/bash
# 🏯 AgencyOS Shell Setup Script
# Sets up aliases for easy CLI access
#
# Usage: bash .claude/scripts/setup-aliases.sh

set -e

MEKONG_DIR="/Users/macbookprom1/mekong-cli"
SHELL_RC="$HOME/.zshrc"

echo "🏯 AgencyOS Shell Setup"
echo "════════════════════════════════════════════════════════════"

# Check if alias already exists
if grep -q "alias agencyos=" "$SHELL_RC" 2>/dev/null; then
    echo "⚠️  Alias 'agencyos' already exists in $SHELL_RC"
    echo "   Skipping to avoid duplicates."
else
    # Add aliases
    cat >> "$SHELL_RC" << 'EOF'

# 🏯 AgencyOS CLI Aliases (Added by setup-aliases.sh)
alias agencyos='cd /Users/macbookprom1/mekong-cli && PYTHONPATH=. python3 cli/main.py'
alias aos='agencyos'
alias aos-test='cd /Users/macbookprom1/mekong-cli && PYTHONPATH=. python3 tests/test_wow.py'
alias aos-ship='cd /Users/macbookprom1/mekong-cli && git add -A && git commit -m "🏯 ship" && git push'

EOF
    echo "✅ Added aliases to $SHELL_RC"
fi

echo ""
echo "📋 Available Commands:"
echo "   agencyos         - Main CLI (e.g., agencyos help)"
echo "   aos              - Short alias for agencyos"
echo "   aos-test         - Run WOW test suite"
echo "   aos-ship         - Quick git commit and push"
echo ""
echo "📍 Examples:"
echo "   agencyos help"
echo "   agencyos binh-phap \"My idea\""
echo "   agencyos cook \"new feature\""
echo "   agencyos money-maker quote \"Client\" warrior"
echo ""
echo "🔄 Run this to activate:"
echo "   source ~/.zshrc"
echo ""
echo "════════════════════════════════════════════════════════════"
echo "🏯 \"Không đánh mà thắng\" - Win Without Fighting"
