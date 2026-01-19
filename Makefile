# 🏯 Agency OS - Makefile
# ========================
# "Không đánh mà thắng" - Win Without Fighting

.PHONY: all demo server test install clean help

# Default target
all: help

# Install dependencies
install:
	@echo "📦 Installing dependencies..."
	pip install -r requirements.txt
	@echo "✅ Done!"

# Run unified demo
demo:
	@echo "🎮 Running Agency OS Demo..."
	python3 demo.py

# Run FastAPI server
server:
	@echo "🚀 Starting Agency OS API Server..."
	@echo "📖 Swagger docs: http://localhost:8000/docs"
	python3 -m uvicorn backend.api.main:app --reload --port 8000

# Run tests
test:
	@echo "🧪 Running Test Suite..."
	pytest tests/

# Clean cache
clean:
	@echo "🧹 Cleaning cache..."
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@echo "✅ Clean!"

# Show stats
stats:
	@echo "📊 Agency OS Stats:"
	@echo "   Python files: $$(find . -name '*.py' | grep -v node_modules | wc -l)"
	@echo "   Core Modules: $$(find core -maxdepth 1 -type d | wc -l)"
	@git log --oneline | head -5

# Help
help:
	@echo ""
	@echo "🏯 AGENCY OS - COMMANDS"
	@echo "========================"
	@echo ""
	@echo "  make install  - Install dependencies"
	@echo "  make demo     - Run unified demo"
	@echo "  make server   - Start API server (port 8000)"
	@echo "  make test     - Run all tests"
	@echo "  make clean    - Clean cache files"
	@echo "  make stats    - Show project stats"
	@echo ""