#!/bin/bash
# 🏯 Install Mekong CLI Alias
# Run: source scripts/ops/install_alias.sh

# Resolve root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "📍 Linking Mekong CLI from: $PROJECT_ROOT"

# Add alias to zshrc if not exists
if ! grep -q "mekong()" ~/.zshrc; then
    cat << EOF >> ~/.zshrc

# 🏯 Mekong CLI
mekong() {
    python3 "$PROJECT_ROOT/main.py" "\$@"
}

# Quick aliases
alias mk='mekong'
alias mks='mekong sales'
alias mko='mekong outreach'
alias mkf='mekong finance'
alias mkops='mekong ops'
EOF
    echo "✅ Aliases added to ~/.zshrc"
else
    echo "ℹ️  Aliases already exist in ~/.zshrc"
fi

echo ""
echo "Usage:"
echo "  mekong --help        # Show all commands"
echo "  mekong finance revenue # Check revenue"
echo ""
echo "Run: source ~/.zshrc"