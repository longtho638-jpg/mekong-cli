#!/bin/bash

# Antigravity SaaS Starter Kit Bundle - Initialization Script
# Version: 1.0.0

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Initializing Antigravity SaaS Starter Kit Bundle...${NC}"

# Check for pnpm
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install it first: npm install -g pnpm"
    exit 1
fi

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo "⚠️ Docker is not found. Some features (database, redis) may not work without it."
fi

# Setup Environment Variables
echo -e "\n${BLUE}📝 Setting up environment variables...${NC}"
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}✅ Created .env from .env.example${NC}"
    echo "👉 Please update .env with your actual keys (Stripe, Database, etc.)"
else
    echo "ℹ️ .env already exists, skipping copy."
fi

# Install Dependencies
echo -e "\n${BLUE}📦 Installing dependencies via pnpm...${NC}"
pnpm install
echo -e "${GREEN}✅ Dependencies installed.${NC}"

# Initialize Database (if Docker is running)
if docker info &> /dev/null; then
    read -p "Do you want to start the database services now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "\n${BLUE}🐳 Starting Docker services...${NC}"
        docker-compose up -d db redis
        echo -e "${GREEN}✅ Database and Redis started.${NC}"

        echo -e "\n${BLUE}⏳ Waiting for database to be ready...${NC}"
        sleep 5

        # Run Prisma migrations if API app exists
        if [ -d "apps/api/prisma" ]; then
             echo -e "${BLUE}🔄 Running database migrations...${NC}"
             # Navigate to API directory to run prisma commands
             # Assuming shared DB URL in .env
             cd apps/api
             npx prisma migrate dev --name init
             cd ../..
             echo -e "${GREEN}✅ Migrations applied.${NC}"
        fi
    fi
else
    echo "⚠️ Docker is not running. Skipping database startup."
fi

echo -e "\n${GREEN}🎉 Setup Complete!${NC}"
echo -e "\nNext steps:"
echo "1. Update .env with your secrets"
echo "2. Run 'pnpm dev' to start all applications"
echo "3. Check QUICK_START.md for more details"
