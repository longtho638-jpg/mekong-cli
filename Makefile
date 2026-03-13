.PHONY: all install dev test lint format server clean stats help setup health build \
        generate-contracts validate-contracts self-test regenerate \
        start-daemon stop-daemon daemon-status start-gateway \
        pev-test pev-lint pev-build pev-publish

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

# === Factory / Contracts ===
generate-contracts:
	python3 factory/generate_contracts.py

validate-contracts:
	python3 factory/validate_contracts.py

self-test:
	python3 factory/self_test.py

regenerate: generate-contracts validate-contracts self-test

# === Daemon ===
start-daemon:
	@echo "Starting Tôm Hùm daemon..."
	@cd apps/openclaw-worker && node index.js &
	@echo "Daemon started (PID $$!)"

stop-daemon:
	@pkill -f "openclaw-worker" 2>/dev/null && echo "Daemon stopped" || echo "Daemon not running"

daemon-status:
	@pgrep -f "openclaw-worker" > /dev/null && echo "Daemon: RUNNING" || echo "Daemon: STOPPED"

# === PEV Engine ===
pev-test:
	python3 -m pytest tests/core/ -v --tb=short --cov=src/core --cov-report=term-missing

pev-lint:
	python3 -m ruff check src/core/ tests/core/
	python3 -m black --check --line-length 100 src/core/ tests/core/
	python3 -m isort --check-only --profile black --line-length 100 src/core/ tests/core/

pev-build:
	python3 -m build

pev-publish: pev-lint pev-test pev-build
	python3 -m twine upload dist/*

# === Gateway ===
start-gateway:
	python3 -m uvicorn src.core.gateway:app --reload --port 8000

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
	@echo "  Factory / Contracts:"
	@echo "    make generate-contracts  Generate JSON contracts from commands"
	@echo "    make validate-contracts  Validate contracts against schemas"
	@echo "    make self-test           Run health check (score 0-100)"
	@echo "    make regenerate          generate + validate + self-test"
	@echo ""
	@echo "  PEV Engine:"
	@echo "    make pev-test     Run PEV core tests with coverage"
	@echo "    make pev-lint     Lint PEV core (ruff+black+isort)"
	@echo "    make pev-build    Build Python package"
	@echo "    make pev-publish  Lint + test + build + publish"
	@echo ""
	@echo "  Daemon:"
	@echo "    make start-daemon   Start Tôm Hùm autonomous daemon"
	@echo "    make stop-daemon    Stop the daemon"
	@echo "    make daemon-status  Check daemon status"
	@echo "    make start-gateway  Start FastAPI gateway :8000"
	@echo ""
