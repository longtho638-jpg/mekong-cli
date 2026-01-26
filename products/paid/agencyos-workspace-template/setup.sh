#!/bin/bash
# AgencyOS Workspace Setup Script
# "Weaponize your agency in seconds."

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}"
echo "    ___                                  ___  ____ "
echo "   /   |____ ____  ____  _______  __    / _ \/ __/ "
echo "  / /| / __ \`/ _ \/ __ \/ ___/ / / /   / // /\ \   "
echo " / ___/ /_/ /  __/ / / / /__/ /_/ /   / // /___/ / "
echo "/_/   \__, /\___/_/ /_/\___/\__, /    \___//____/  "
echo "     /____/                /____/                  "
echo -e "${NC}"
echo -e "${BLUE}AgencyOS Workspace Setup${NC}"
echo "=================================================="

# 1. Inputs
echo -e "\n${YELLOW}Step 1: Identity${NC}"
read -p "Enter your Agency Name (e.g., Antigravity): " AGENCY_NAME
read -p "Enter Founder Name (e.g., Minh Long): " FOUNDER_NAME
read -p "Enter Primary Niche (e.g., Fintech): " NICHE

if [ -z "$AGENCY_NAME" ]; then
  echo -e "${RED}Error: Agency Name is required.${NC}"
  exit 1
fi

if [ -z "$FOUNDER_NAME" ]; then
  FOUNDER_NAME="Founder"
fi

# 2. Configuration
echo -e "\n${YELLOW}Step 2: Configuring Workspace...${NC}"

CONFIG_FILE=".agency/config.json"

# Use python to update JSON reliably
python3 .agency/scripts/configure.py "$AGENCY_NAME" "$FOUNDER_NAME" "$NICHE"

echo -e "${GREEN}✓ Config updated.${NC}"

# 3. Personalization (Find & Replace)
echo -e "\n${YELLOW}Step 3: Personalizing Files...${NC}"

# Function to escape special characters for sed
escape_sed() {
    echo "$1" | sed -e 's/[]\/$*.^[]/\\&/g'
}

SAFE_AGENCY_NAME=$(escape_sed "$AGENCY_NAME")
SAFE_FOUNDER_NAME=$(escape_sed "$FOUNDER_NAME")

# Find all text files and replace placeholders
# Exclude .git, node_modules, and binary files
grep -rIl "{{AGENCY_NAME}}" . | grep -vE "^./.git" | grep -vE "setup.sh" | xargs -I {} sed -i '' "s/{{AGENCY_NAME}}/$SAFE_AGENCY_NAME/g" {}
grep -rIl "{{FOUNDER_NAME}}" . | grep -vE "^./.git" | grep -vE "setup.sh" | xargs -I {} sed -i '' "s/{{FOUNDER_NAME}}/$SAFE_FOUNDER_NAME/g" {}

echo -e "${GREEN}✓ Placeholders replaced.${NC}"

# 4. Platform Setup
echo -e "\n${YELLOW}Step 4: Platform Setup...${NC}"

if [ -d "platform/dashboard" ] && [ -f "platform/dashboard/package.json" ]; then
    echo "Installing Dashboard dependencies..."
    cd platform/dashboard && npm install
    cd ../..
else
    echo "⚠️  Dashboard not found or empty. Skipping npm install."
fi

if [ -d "platform/website" ] && [ -f "platform/website/package.json" ]; then
    echo "Installing Website dependencies..."
    cd platform/website && npm install
    cd ../..
else
    echo "⚠️  Website not found or empty. Skipping npm install."
fi

# 5. Cleanup
echo -e "\n${YELLOW}Step 5: Finalizing...${NC}"
if [ -f "SETUP.md" ]; then
    mv SETUP.md .agency/docs/TEMPLATE_SETUP.md
    echo "Moved setup guide to .agency/docs/"
fi

echo -e "\n${GREEN}=========================================="
echo -e "   🚀 AgencyOS Workspace Ready!"
echo -e "==========================================${NC}"
echo -e "\nNext steps:"
echo "1. Review your strategy in 10-STRATEGY/"
echo "2. Start your dashboard: cd platform/dashboard && npm run dev"
echo "3. Win."
echo ""
