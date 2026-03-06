#!/bin/bash
# Generate SBOM with cyclonedx-cli for Mekong CLI
#
# Usage: ./scripts/generate-sbom.sh [--output <file>]
#
# Output: sbom.json (CycloneDX 1.5 format)

set -e

# Configuration
OUTPUT_FILE="${1:-sbom.json}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🔨 Generating SBOM for Mekong CLI..."
echo "   Output: $OUTPUT_FILE"
echo "   Project: $PROJECT_ROOT"

# Check if cyclonedx-bom is installed
if ! command -v cyclonedx-bom &> /dev/null; then
    echo "⚠️  cyclonedx-bom not found. Installing..."
    pip3 install cyclonedx-bom
fi

# Navigate to project root
cd "$PROJECT_ROOT"

# Generate SBOM from requirements
echo "📦 Scanning dependencies..."
cyclonedx-bom \
    --output-format JSON \
    --output-file "$OUTPUT_FILE" \
    --without-dev-dependencies \
    .

# Add metadata using jq (if available)
if command -v jq &> /dev/null; then
    echo "🏷️  Adding metadata..."

    # Get version from pyproject.toml
    VERSION=$(grep -m1 '^version = ' pyproject.toml | cut -d'"' -f2)

    # Add metadata to SBOM
    TEMP_FILE="${OUTPUT_FILE}.tmp"
    jq --arg version "$VERSION" '
        .metadata.component.version = $version |
        .metadata.component.name = "mekong-cli" |
        .metadata.component.supplier.name = "Binh Phap Venture Studio" |
        .metadata.timestamp = now | todate |
        .metadata.tools[0].version = "0.24.0"
    ' "$OUTPUT_FILE" > "$TEMP_FILE"
    mv "$TEMP_FILE" "$OUTPUT_FILE"
fi

# Validate SBOM schema
echo "✅ Validating SBOM schema..."
if command -v cyclonedx-cli &> /dev/null; then
    cyclonedx-cli validate --input-file "$OUTPUT_FILE" || {
        echo "❌ SBOM validation failed!"
        exit 1
    }
fi

# Print summary
echo ""
echo "✅ SBOM generated successfully!"
echo "   File: $OUTPUT_FILE"

if command -v jq &> /dev/null; then
    COMPONENTS=$(jq '.components | length' "$OUTPUT_FILE")
    echo "   Components: $COMPONENTS"

    VERSION=$(jq -r '.metadata.component.version' "$OUTPUT_FILE")
    echo "   Version: $VERSION"
fi

echo ""
echo "📋 To view SBOM contents:"
echo "   cat $OUTPUT_FILE | jq '.components[] | {name, version}'"
