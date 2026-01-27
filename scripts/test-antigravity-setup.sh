#!/bin/bash

# ==============================================================================
# 🧪 ANTIGRAVITY SETUP TEST HARNESS
#
# Runs the setup-antigravity.sh script in various Docker containers
# to verify compatibility and correct installation.
#
# Usage: ./scripts/test-antigravity-setup.sh [distro]
# Supported distros: ubuntu, debian, centos, all
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
SETUP_SCRIPT="$ROOT_DIR/scripts/setup-antigravity.sh"
TEST_DIR="$ROOT_DIR/tests/deployment"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

function log_info() {
    echo -e "${BLUE}[TEST INFO]${NC} $1"
}

function log_success() {
    echo -e "${GREEN}[TEST SUCCESS]${NC} $1"
}

function log_fail() {
    echo -e "${RED}[TEST FAIL]${NC} $1"
}

function build_and_run() {
    local distro=$1
    local dockerfile="$TEST_DIR/Dockerfile.$distro"

    log_info "Testing on $distro..."

    if [[ ! -f "$dockerfile" ]]; then
        log_fail "Dockerfile for $distro not found at $dockerfile"
        return 1
    fi

    # Build container
    log_info "Building image antigravity-test:$distro..."
    if ! docker build -t "antigravity-test:$distro" -f "$dockerfile" "$ROOT_DIR"; then
        log_fail "Failed to build Docker image for $distro"
        return 1
    fi

    # Run setup script inside container
    log_info "Running setup script in container..."
    # Pass a dummy API key to bypass interactive prompt
    if docker run --rm -e GEMINI_API_KEY="test-key-123" "antigravity-test:$distro"; then
        log_success "Setup script completed successfully on $distro"
        return 0
    else
        log_fail "Setup script failed on $distro"
        return 1
    fi
}

# Main execution
DISTRO=${1:-all}

if [[ "$DISTRO" == "all" ]]; then
    FAILURES=0
    for d in ubuntu debian centos; do
        if ! build_and_run "$d"; then
            FAILURES=$((FAILURES + 1))
        fi
    done

    if [[ $FAILURES -eq 0 ]]; then
        log_success "All tests passed!"
        exit 0
    else
        log_fail "$FAILURES tests failed."
        exit 1
    fi
else
    if build_and_run "$DISTRO"; then
        exit 0
    else
        exit 1
    fi
fi
