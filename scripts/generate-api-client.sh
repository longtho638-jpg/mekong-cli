#!/bin/bash
# Generate TypeScript client from OpenAPI spec

# Exit on error
set -e

# Get the project root directory (one level up from scripts)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Input and Output paths
INPUT_FILE="$PROJECT_ROOT/scripts/openapi.json"
OUTPUT_DIR="$PROJECT_ROOT/apps/dashboard/lib/api-client"

echo "📍 Project Root: $PROJECT_ROOT"
echo "📄 Input Spec: $INPUT_FILE"
echo "📂 Output Dir: $OUTPUT_DIR"

# Check if input file exists
if [ ! -f "$INPUT_FILE" ]; then
    echo "❌ Error: OpenAPI spec file not found at $INPUT_FILE"
    echo "   Run 'python3 scripts/export_openapi.py' first."
    exit 1
fi

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Generate client
# We use --useOptions to generate a more flexible client
echo "🚀 Generating TypeScript client..."
npx openapi-typescript-codegen \
    --input "$INPUT_FILE" \
    --output "$OUTPUT_DIR" \
    --client fetch \
    --name AgencyOSClient

echo "✅ Client generated successfully in $OUTPUT_DIR"
