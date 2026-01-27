#!/bin/bash

# AgencyOS Workspace Setup Script
# Version: 1.0.0
# Author: Antigravity Venture Studio

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}   AgencyOS Workspace Template Setup     ${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# 1. Ask for Agency Name
read -p "Enter your Agency Name (e.g., Mekong Digital): " AGENCY_NAME
SAFE_NAME=$(echo "$AGENCY_NAME" | tr ' ' '-' | tr '[:upper:]' '[:lower:]')
TIMESTAMP=$(date +%Y%m%d)
TARGET_DIR="${SAFE_NAME}-workspace"

echo ""
echo -e "Initializing workspace for ${GREEN}$AGENCY_NAME${NC}..."

# 2. Check if directory exists
if [ -d "$TARGET_DIR" ]; then
    echo "Directory $TARGET_DIR already exists. Please choose a different name or remove the existing directory."
    exit 1
fi

# 3. Create Directory
mkdir -p "$TARGET_DIR"

# 4. Copy Files
# Determine script directory to find templates
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "Copying template files..."
# Exclude the script itself and git artifacts
rsync -av --exclude='setup.sh' --exclude='.git' --exclude='.gitignore' "$SCRIPT_DIR/" "$TARGET_DIR/"

# 5. Personalize README
if [ -f "$TARGET_DIR/README_OPS.md" ]; then
    mv "$TARGET_DIR/README_OPS.md" "$TARGET_DIR/README.md"
    sed -i.bak "s/AgencyOS Workspace Template/$AGENCY_NAME Workspace/g" "$TARGET_DIR/README.md"
    rm "$TARGET_DIR/README.md.bak" 2>/dev/null || true
fi

# 6. Initialize Git (Optional)
read -p "Do you want to initialize a git repository? (y/n): " INIT_GIT
if [[ "$INIT_GIT" == "y" || "$INIT_GIT" == "Y" ]]; then
    cd "$TARGET_DIR"
    git init
    echo "Git repository initialized."
    cd ..
fi

echo ""
echo -e "${GREEN}Success! Your workspace is ready.${NC}"
echo -e "Location: ${BLUE}$(pwd)/$TARGET_DIR${NC}"
echo ""
echo "Next Steps:"
echo "1. cd $TARGET_DIR"
echo "2. Read README.md (User Manual)"
echo "3. Start organizing your agency!"
echo ""
echo -e "${BLUE}Welcome to the Antigravity Ecosystem.${NC}"
