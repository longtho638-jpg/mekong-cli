#!/bin/bash
# Sign SBOM with cosign for supply chain security
#
# Usage: ./scripts/sign-sbom.sh [sbom.json]
#
# Requires: cosign installed and configured

set -e

SBOM_FILE="${1:-sbom.json}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔐 Signing SBOM: $SBOM_FILE"

# Check if cosign is installed
if ! command -v cosign &> /dev/null; then
    echo "⚠️  cosign not found. Please install:"
    echo "   brew install cosign (macOS)"
    echo "   or: https://docs.sigstore.dev/cosign/installation/"
    exit 1
fi

# Check if SBOM file exists
if [ ! -f "$SBOM_FILE" ]; then
    echo "❌ SBOM file not found: $SBOM_FILE"
    exit 1
fi

# Check if COSIGN_KEY is set (for key-based signing)
if [ -n "$COSIGN_PRIVATE_KEY" ]; then
    echo "🔑 Signing with private key..."
    cosign sign-blob \
        --key "$COSIGN_PRIVATE_KEY" \
        "$SBOM_FILE" \
        --output-signature "${SBOM_FILE}.sig" \
        --output-certificate "${SBOM_FILE}.crt"

    echo "✅ SBOM signed successfully!"
    echo "   Signature: ${SBOM_FILE}.sig"
    echo "   Certificate: ${SBOM_FILE}.crt"
else
    echo "🔐 Signing with keyless mode (requires Fulcio/Rekor)..."

    # Keyless signing using Fulcio and Rekor
    cosign sign-blob \
        "$SBOM_FILE" \
        --output-signature "${SBOM_FILE}.sig" \
        --output-certificate "${SBOM_FILE}.crt" \
        --yes

    echo "✅ SBOM signed successfully (keyless)!"
    echo "   Signature: ${SBOM_FILE}.sig"
    echo "   Certificate: ${SBOM_FILE}.crt"
fi

# Verify signature
echo ""
echo "🔍 Verifying signature..."
cosign verify-blob \
    --signature "${SBOM_FILE}.sig" \
    --certificate "${SBOM_FILE}.crt" \
    --certificate-identity-regexp ".*" \
    --certificate-oidc-issuer-regexp ".*" \
    "$SBOM_FILE" && echo "✅ Signature verified!"

echo ""
echo "📦 SBOM and signature ready for release:"
echo "   - $SBOM_FILE"
echo "   - ${SBOM_FILE}.sig"
echo "   - ${SBOM_FILE}.crt"
