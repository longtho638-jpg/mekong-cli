#!/bin/bash
# 🏯 Install Overlord CLI Alias
# Run: source scripts/install_alias.sh

MEKONG_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Create alias function
cat << 'EOF' >> ~/.zshrc

# 🏯 Mekong CLI Overlord
mekong() {
    python3 ~/mekong-cli/scripts/overlord.py "$@"
}

# Quick aliases
alias mk='mekong'
alias mkd='mekong daily'
alias mkt='mekong test'
alias mks='mekong ship'
EOF

echo "✅ Aliases installed!"
echo ""
echo "Usage:"
echo "  mekong daily   # Morning dashboard"
echo "  mekong test    # Run tests"
echo "  mekong ship    # Ship pipeline"
echo ""
echo "Or use short aliases:"
echo "  mkd  # mekong daily"
echo "  mkt  # mekong test"
echo "  mks  # mekong ship"
echo ""
echo "Run: source ~/.zshrc"
