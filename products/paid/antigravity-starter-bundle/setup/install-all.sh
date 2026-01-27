#!/bin/bash

# Antigravity Universal Installer
# Installs dependencies and sets up environment for all available products.

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Antigravity Bundle Setup...${NC}"

# Function to setup a product
setup_product() {
    PRODUCT_DIR=$1
    PRODUCT_NAME=$2

    if [ -d "$PRODUCT_DIR" ]; then
        echo -e "\n${BLUE}📦 Setting up $PRODUCT_NAME...${NC}"
        cd "$PRODUCT_DIR"

        # Copy .env if it doesn't exist
        if [ ! -f ".env" ]; then
            if [ -f ".env.example" ]; then
                echo "   Creating .env from .env.example"
                cp .env.example .env
            else
                echo "   ⚠️ No .env.example found, skipping .env creation."
            fi
        else
            echo "   .env already exists."
        fi

        # Install dependencies
        if [ -f "package.json" ]; then
            echo "   Installing dependencies..."
            npm install --silent
            echo -e "   ${GREEN}✅ $PRODUCT_NAME ready!${NC}"
        else
             echo "   ⚠️ No package.json found. Is this a Node.js project?"
        fi

        cd - > /dev/null
    else
        echo -e "\n⚠️ Product directory for $PRODUCT_NAME not found at $PRODUCT_DIR"
    fi
}

# Main execution path - assumed to be run from 'setup' dir or root
# Resolve root directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Working directory: $ROOT_DIR"

setup_product "$ROOT_DIR/products/social-auth-kit" "Social Auth Kit"
setup_product "$ROOT_DIR/products/agencyos-workspace" "AgencyOS Workspace"
setup_product "$ROOT_DIR/products/user-preferences-kit" "User Preferences Kit"

# Placeholder for future products
# setup_product "$ROOT_DIR/products/webhook-manager-kit" "Webhook Manager Kit"
# setup_product "$ROOT_DIR/products/api-rate-limiter-kit" "API Rate Limiter Kit"

echo -e "\n${GREEN}🎉 All available products installed successfully!${NC}"
echo -e "To start a product, navigate to its directory and run 'npm run dev'."
