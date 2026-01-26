#!/bin/bash

# ==============================================================================
# 🚀 ANTIGRAVITY BOOTLOADER v1.0.0
# "Ignition Sequence Start..."
#
# This script prepares your machine for the Antigravity IDE.
# It automates the installation of Homebrew, Node.js, Python, and the Proxy.
#
# AUTHOR: Antigravity Engineering
# DATE: 2026-01-26
# ==============================================================================

# --- COLORS & STYLING (Hacker Mode) ---
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}"
cat << "EOF"
    _          _   _                      _ _
   / \   _ __ | |_(_) __ _ _ __ __ ___   (_) |_ _   _
  / _ \ | '_ \| __| |/ _` | '__/ _` \ \ / / | __| | | |
 / ___ \| | | | |_| | (_| | | | (_| |\ V /| | |_| |_| |
/_/   \_\_| |_|\__|_|\__, |_|  \__,_| \_/ |_|\__|\__, |
                     |___/                       |___/
          >>> COMMAND CENTER BOOTLOADER <<<
EOF
echo -e "${NC}"

# --- HELPER FUNCTIONS ---

function log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

function log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

function log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

function log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

function check_os() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        OS_TYPE="macos"
        log_info "Detected OS: macOS"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS_TYPE="linux"
        if [ -f /etc/os-release ]; then
            . /etc/os-release
            DISTRO=$ID
            log_info "Detected OS: Linux ($DISTRO)"
        else
            log_warn "Detected Linux but cannot identify distro. Assuming generic."
            DISTRO="generic"
        fi
    else
        log_error "Unsupported OS: $OSTYPE"
    fi
}

function check_hardware() {
    log_info "Scanning hardware signature..."

    # Check Architecture
    ARCH=$(uname -m)
    log_info "Architecture: $ARCH"

    # Check RAM
    if [[ "$OS_TYPE" == "macos" ]]; then
        RAM_BYTES=$(sysctl hw.memsize | awk '{print $2}')
        RAM_GB=$((RAM_BYTES / 1024 / 1024 / 1024))
    elif [[ "$OS_TYPE" == "linux" ]]; then
        # Get total memory in KB and convert to GB
        RAM_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
        RAM_GB=$((RAM_KB / 1024 / 1024))
    fi

    if [[ $RAM_GB -ge 32 ]]; then
        log_success "RAM: ${RAM_GB}GB. Warlord Status Confirmed."
    elif [[ $RAM_GB -ge 16 ]]; then
        log_warn "RAM: ${RAM_GB}GB. Scout Status. Acceptable, but close applications."
    else
        log_error "RAM: ${RAM_GB}GB. Insufficient. Minimum 16GB required. Abort."
    fi
}

function install_homebrew() {
    if [[ "$OS_TYPE" == "macos" ]]; then
        if ! command -v brew &> /dev/null; then
            log_info "Homebrew not found. Installing the package manager..."
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

            # Add to PATH for Apple Silicon
            if [[ -f "/opt/homebrew/bin/brew" ]]; then
                eval "$(/opt/homebrew/bin/brew shellenv)"
            fi
        else
            log_success "Homebrew already installed."
        fi
    elif [[ "$OS_TYPE" == "linux" ]]; then
        log_info "Skipping Homebrew on Linux. Will use native package manager."
    fi
}

function install_deps() {
    log_info "Deploying dependencies..."

    if [[ "$OS_TYPE" == "macos" ]]; then
        brew update

        PACKAGES=(
            "git"
            "node"
            "python@3.11"
            "ffmpeg"
            "jq"
            "wget"
            "tree"
        )

        for pkg in "${PACKAGES[@]}"; do
            if brew list "$pkg" &> /dev/null; then
                log_success "$pkg already deployed."
            else
                log_info "Installing $pkg..."
                brew install "$pkg"
            fi
        done

    elif [[ "$OS_TYPE" == "linux" ]]; then
        if [[ "$DISTRO" == "ubuntu" || "$DISTRO" == "debian" ]]; then
            log_info "Updating apt repositories..."
            sudo apt-get update

            # Common packages
            PKGS="git nodejs npm ffmpeg jq wget tree build-essential"

            # Python 3.11 specific for Ubuntu/Debian
            # Note: Might need software-properties-common and deadsnakes ppa for older ubuntu
            # ensuring python3-pip is installed
            PKGS="$PKGS python3 python3-pip python3-venv"

            log_info "Installing packages: $PKGS"
            sudo apt-get install -y $PKGS

        elif [[ "$DISTRO" == "centos" || "$DISTRO" == "fedora" || "$DISTRO" == "rhel" ]]; then
            log_info "Updating yum/dnf..."
            if command -v dnf &> /dev/null; then
                PKG_MGR="dnf"
            else
                PKG_MGR="yum"
            fi

            sudo $PKG_MGR check-update

            PKGS="git nodejs npm ffmpeg jq wget tree"
            # Python handling might vary, usually python3 is available
            PKGS="$PKGS python3 python3-pip"

            log_info "Installing packages using $PKG_MGR: $PKGS"
            sudo $PKG_MGR install -y $PKGS

            # Install 'Development Tools' group if needed
            sudo $PKG_MGR groupinstall -y "Development Tools"
        else
             log_warn "Unsupported Linux distro for automatic dependency installation. Please install git, node, python3.11, ffmpeg, jq, wget manually."
        fi
    fi
}

function setup_proxy() {
    log_info "Establishing secure tunnel (Antigravity Proxy)..."

    if npm list -g antigravity-claude-proxy &> /dev/null; then
        log_success "Proxy module already installed."
    else
        log_info "Installing proxy via npm..."
        npm install -g antigravity-claude-proxy
    fi

    log_info "Verifying proxy configuration..."
    # Check for Gemini API Key
    if [[ -z "$GEMINI_API_KEY" ]]; then
        log_warn "GEMINI_API_KEY not found in environment."
        echo -e "${YELLOW}>>> PLEASE ENTER YOUR GEMINI API KEY (Input is hidden):${NC}"
        read -s USER_KEY

        # Determine shell profile
        SHELL_PROFILE="$HOME/.zshrc"
        if [[ "$SHELL" == *"bash"* ]]; then
            SHELL_PROFILE="$HOME/.bashrc"
        fi

        echo "" >> "$SHELL_PROFILE"
        echo "export GEMINI_API_KEY='$USER_KEY'" >> "$SHELL_PROFILE"
        export GEMINI_API_KEY="$USER_KEY"
        log_success "API Key secured in $SHELL_PROFILE."
    else
        log_success "GEMINI_API_KEY detected."
    fi
}

function verify_health() {
    log_info "Running final diagnostics..."

    echo -e "\n--------------------------------------------------"
    echo -e "SYSTEM HEALTH REPORT"
    echo -e "--------------------------------------------------"

    echo -n "Node.js:   " && node -v
    if command -v python3.11 &> /dev/null; then
        echo -n "Python:    " && python3.11 --version
    else
        echo -n "Python:    " && python3 --version
    fi
    echo -n "Git:       " && git --version
    echo -n "Proxy:     " && echo "Installed (v$(npm list -g antigravity-claude-proxy --depth=0 | grep proxy | cut -d @ -f 2))"

    echo -e "--------------------------------------------------\n"
}

# --- MAIN EXECUTION FLOW ---

check_os
check_hardware
install_homebrew
install_deps
setup_proxy
verify_health

echo -e "${GREEN}"
cat << "EOF"
==================================================
   >>> COMMAND CENTER READY <<<

   Protocol:    GREEN LIGHT
   Next Step:   Type 'antigravity-claude-proxy start'
                Then run 'cc' to begin mission.
==================================================
EOF
echo -e "${NC}"
