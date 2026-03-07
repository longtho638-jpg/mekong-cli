#!/usr/bin/env bash
# scripts/build-binary.sh - Build mekong-cli binary with PyInstaller
# Usage: ./scripts/build-binary.sh

set -e

echo "🐉 Building Mekong CLI Binary..."
echo "================================"

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist/ build/

# Install build dependencies
echo "📦 Installing build dependencies..."
poetry install --with build

# Build with PyInstaller
echo "🔨 Running PyInstaller..."
poetry run pyinstaller mekong.spec --clean

# Verify binary
if [ -f "dist/mekong" ]; then
    echo ""
    echo "✅ Binary created: dist/mekong"
    echo "📊 Binary size: $(du -h dist/mekong | cut -f1)"

    # Make executable
    chmod +x dist/mekong

    echo ""
    echo "⏱️  Startup test (3 runs):"
    for i in 1 2 3; do
        echo "  Run $i:"
        time dist/mekong --version 2>&1 | head -1
    done

    echo ""
    echo "📋 Help test:"
    dist/mekong --help | head -5

    echo ""
    echo "================================"
    echo "✅ Build complete!"
    echo "📦 Binary: dist/mekong"
    echo "📊 Size: $(du -h dist/mekong | cut -f1)"
    echo "================================"
else
    echo ""
    echo "❌ Build failed - dist/mekong not found"
    exit 1
fi
