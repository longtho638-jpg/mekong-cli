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
	uvicorn server:app --reload --port 8000

# Run tests
test:
	@echo "🧪 Testing module imports..."
	python3 -c "from core import CRM, Scheduler, FranchiseSystem; print('✅ Core modules OK')"
	python3 -c "from locales import i18n, t; print('✅ i18n OK')"
	python3 -c "from regions.vietnam import VietnamConfig; print('✅ Vietnam OK')"
	python3 -c "from server import app; print('✅ Server OK')"
	@echo "✅ All tests passed!"

# Quick test
quick:
	@python3 -c "from core import CRM; from locales import t; print(t('common.welcome'))"

# i18n demo
i18n:
	python3 locales/__init__.py

# Vietnam region demo
vietnam:
	python3 regions/vietnam/__init__.py

# Franchise demo
franchise:
	python3 core/franchise.py

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
	@echo "   Total lines: $$(find . -name '*.py' | grep -v node_modules | xargs wc -l 2>/dev/null | tail -1)"
	@git log --oneline | head -10

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
	@echo "  make quick    - Quick import test"
	@echo "  make i18n     - Demo i18n system"
	@echo "  make vietnam  - Demo Vietnam region"
	@echo "  make franchise- Demo franchise system"
	@echo "  make clean    - Clean cache files"
	@echo "  make stats    - Show project stats"
	@echo ""
	@echo "  \"Không đánh mà thắng\" 🏯"
	@echo ""
