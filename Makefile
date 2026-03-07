.PHONY: all install dev test lint format server clean stats help setup health

all: help

setup:
	@bash scripts/setup-dev.sh

setup-quick:
	@bash scripts/setup-dev.sh --quick

health:
	@bash scripts/health-check.sh

install:
	pip install -e .

dev:
	pip install -e ".[dev]"

test:
	python3 -m pytest tests/ -v

lint:
	python3 -m ruff check src/ tests/
	python3 -m mypy src/ --ignore-missing-imports

format:
	python3 -m ruff format src/ tests/

server:
	python3 -m uvicorn src.core.gateway:app --reload --port 8000

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	rm -rf .pytest_cache .mypy_cache .ruff_cache build dist *.egg-info

stats:
	@echo "Python files: $$(find src -name '*.py' | wc -l | tr -d ' ')"
	@echo "Test files: $$(find tests -name 'test_*.py' | wc -l | tr -d ' ')"
	@echo "Lines of code: $$(find src -name '*.py' -exec cat {} + | wc -l | tr -d ' ')"

help:
	@echo ""
	@echo "Mekong CLI — Development Commands"
	@echo "=================================="
	@echo ""
	@echo "  make setup   🚀 One-command dev setup (deps + env + config)"
	@echo "  make health  🩺 Check dev environment readiness"
	@echo "  make install  Install package (editable)"
	@echo "  make dev      Install with dev dependencies"
	@echo "  make test     Run test suite"
	@echo "  make lint     Run linters (ruff + mypy)"
	@echo "  make format   Auto-format code"
	@echo "  make server   Start API gateway (port 8000)"
	@echo "  make clean    Remove build artifacts"
	@echo "  make stats    Show project statistics"
	@echo ""
