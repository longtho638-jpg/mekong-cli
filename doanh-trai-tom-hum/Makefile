# ===========================================
# 🦞 LOBSTER EMPIRE — Makefile
# One-command operations for the empire
# ===========================================

.PHONY: up down dev build install clean logs db-studio help

# Default: show help
help:
	@echo ""
	@echo "╔══════════════════════════════════════════╗"
	@echo "║  🦞 LOBSTER EMPIRE — COMMAND CENTER      ║"
	@echo "╠══════════════════════════════════════════╣"
	@echo "║  make install  → Install dependencies    ║"
	@echo "║  make dev      → Start dev servers       ║"
	@echo "║  make up       → Docker up (production)  ║"
	@echo "║  make down     → Docker down             ║"
	@echo "║  make build    → Build all packages      ║"
	@echo "║  make clean    → Clean everything        ║"
	@echo "║  make logs     → Docker logs             ║"
	@echo "║  make db-generate → Gen Prisma Client    ║"
	@echo "║  make db-studio→ Open Prisma Studio      ║"
	@echo "╚══════════════════════════════════════════╝"
	@echo ""

# Install all dependencies
install:
	@echo "🦞 Installing dependencies..."
	pnpm install
	@echo "✅ Dependencies installed!"

# Start development servers (Frontend + Backend)
dev:
	@echo "🦞 Starting development servers..."
	pnpm dev

# Build all packages
build:
	@echo "🦞 Building the empire..."
	pnpm build
	@echo "✅ Build complete!"

# Docker up (production mode)
up:
	@echo "🦞 Deploying the Lobster Empire..."
	docker compose up -d --build
	@echo ""
	@echo "🚀 DOANH TRẠI ĐÃ SẴN SÀNG!"
	@echo "👉 Frontend: http://localhost:3000"
	@echo "👉 Backend:  http://localhost:8000"
	@echo "👉 Database: localhost:5432"
	@echo ""

# Docker down
down:
	@echo "🦞 Shutting down..."
	docker compose down
	@echo "✅ Empire in hibernation."

# Docker logs
logs:
	docker compose logs -f

# Generate Prisma Client
db-generate:
	cd packages/db && pnpm db:generate

# Open Prisma Studio
db-studio:
	cd packages/db && pnpm db:studio

# Clean everything
clean:
	@echo "🧹 Cleaning the empire..."
	pnpm clean
	rm -rf node_modules
	docker compose down -v 2>/dev/null || true
	@echo "✅ Clean!"
