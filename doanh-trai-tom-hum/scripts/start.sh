#!/usr/bin/env bash
# ===========================================
# 🦞 LOBSTER EMPIRE — Bootstrap Script
# One command to rule them all
# ===========================================

set -e

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  🦞 LOBSTER EMPIRE — GENESIS PROTOCOL    ║"
echo "║  Initializing all systems...              ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed."; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "❌ pnpm is required. Install: npm install -g pnpm"; exit 1; }

# Step 1: Install dependencies
echo "📦 [1/3] Installing dependencies..."
pnpm install
echo "✅ Dependencies installed!"
echo ""

# Step 2: Generate Prisma client
echo "🗃️  [2/3] Generating Prisma client..."
cd packages/db && npx prisma generate && cd ../..
echo "✅ Prisma client generated!"
echo ""

# Step 3: Start dev servers
echo "🚀 [3/3] Starting development servers..."
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  🚀 DOANH TRẠI ĐÃ SẴN SÀNG!             ║"
echo "║                                            ║"
echo "║  👉 Frontend: http://localhost:3000        ║"
echo "║  👉 Backend:  http://localhost:8000        ║"
echo "║                                            ║"
echo "║  Mời Đại Tướng Quân ra lệnh tiếp theo!    ║"
echo "╚══════════════════════════════════════════╝"
echo ""

pnpm dev
