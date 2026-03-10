.PHONY: all install dev test lint format server clean stats help setup health build

all: help

# === Setup ===
setup:
	@bash scripts/setup-dev.sh

setup-quick:
	@bash scripts/setup-dev.sh --quick

health:
	@bash scripts/health-check.sh

# === Python CLI ===
install:
	pip install -e .

dev:
	pip install -e ".[dev]"

test:
	python3 -m pytest tests/ -v

test-all: test
	pnpm test

lint:
	python3 -m ruff check src/ tests/
	python3 -m mypy src/ --ignore-missing-imports

format:
	python3 -m ruff format src/ tests/

server:
	python3 -m uvicorn src.core.gateway:app --reload --port 8000

# === Node.js Monorepo ===
build:
	pnpm build

dev-node:
	pnpm dev

lint-node:
	pnpm lint

# === Combined ===
test-full: test
	pnpm test

lint-full: lint lint-node

# === Cleanup ===
clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	rm -rf .pytest_cache .mypy_cache .ruff_cache build dist *.egg-info
	rm -rf .turbo node_modules/.cache

# === Info ===
stats:
	@echo "Python files: $$(find src -name '*.py' | wc -l | tr -d ' ')"
	@echo "Test files: $$(find tests -name 'test_*.py' | wc -l | tr -d ' ')"
	@echo "Lines of code: $$(find src -name '*.py' -exec cat {} + | wc -l | tr -d ' ')"
	@echo "Node packages: $$(ls packages/ | wc -l | tr -d ' ')"
	@echo "Node apps: $$(ls apps/ | wc -l | tr -d ' ')"
	@echo "Version: $$(cat VERSION)"

help:
	@echo ""
	@echo "Mekong CLI v$$(cat VERSION) — Development Commands"
	@echo "================================================="
	@echo ""
	@echo "  Setup:"
	@echo "    make setup        One-command dev setup"
	@echo "    make setup-quick  Quick setup (skip optional)"
	@echo "    make health       Check dev environment"
	@echo ""
	@echo "  Python CLI:"
	@echo "    make install      Install package (editable)"
	@echo "    make dev          Install with dev deps"
	@echo "    make test         Run Python tests"
	@echo "    make lint         Ruff + mypy"
	@echo "    make format       Auto-format Python"
	@echo "    make server       Start API gateway :8000"
	@echo ""
	@echo "  Node.js Monorepo:"
	@echo "    make build        Build all packages (turbo)"
	@echo "    make dev-node     Start all dev servers"
	@echo "    make lint-node    Lint Node packages"
	@echo ""
	@echo "  Combined:"
	@echo "    make test-full    Python + Node tests"
	@echo "    make lint-full    Python + Node linting"
	@echo "    make clean        Remove all build artifacts"
	@echo "    make stats        Project statistics"
	@echo ""
