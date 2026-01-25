#!/bin/bash
# CC CLI - Command Center for One-Person Unicorns
# =================================================
# Usage: ./cc <module> [command] [options]
#
# Modules:
#   revenue    💰 Revenue tracking & forecasting
#   agent      🤖 Agent swarm orchestration
#   devops     🚀 Deployment & backup automation
#   client     👤 Client management & invoicing
#   release    📦 Release automation pipeline
#   analytics  📊 Dashboard, funnel, cohort analysis
#   sales      💼 CRM-lite for agencies
#   content    📝 AI-powered content automation
#   monitor    🔍 System health & monitoring

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
VERSION="2.0.0"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

show_banner() {
    echo -e "${CYAN}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                                                            ║"
    echo "║   🏯 CC CLI v${VERSION} - Command Center                       ║"
    echo "║   The One-Person Unicorn Operating System                  ║"
    echo "║   \"Khong danh ma thang\" - Win Without Fighting             ║"
    echo "║                                                            ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

show_help() {
    show_banner
    echo "Usage: ./cc <module> [command] [options]"
    echo ""
    echo -e "${GREEN}Available Modules:${NC}"
    echo "  revenue    💰 Revenue tracking & forecasting"
    echo "  agent      🤖 Agent swarm orchestration"
    echo "  devops     🚀 Deployment & backup automation"
    echo "  client     👤 Client management & invoicing"
    echo "  release    📦 Release automation pipeline"
    echo "  analytics  📊 Dashboard, funnel, cohort analysis"
    echo "  sales      💼 CRM-lite for agencies"
    echo "  content    📝 AI-powered content automation"
    echo "  monitor    🔍 System health & monitoring"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  ./cc revenue summary --period monthly"
    echo "  ./cc agent list"
    echo "  ./cc devops deploy --env production"
    echo "  ./cc client list --status active"
    echo "  ./cc monitor health"
    echo ""
    echo "Run './cc <module> --help' for module-specific commands"
}

# Route to appropriate module
case "$1" in
    revenue)
        shift
        python3 "$SCRIPT_DIR/scripts/cc_revenue.py" "$@"
        ;;
    agent)
        shift
        python3 "$SCRIPT_DIR/scripts/cc_agent.py" "$@"
        ;;
    devops)
        shift
        python3 "$SCRIPT_DIR/scripts/cc_devops.py" "$@"
        ;;
    client)
        shift
        python3 "$SCRIPT_DIR/scripts/cc_client.py" "$@"
        ;;
    release)
        shift
        python3 "$SCRIPT_DIR/scripts/cc_release.py" "$@"
        ;;
    analytics)
        shift
        python3 "$SCRIPT_DIR/scripts/cc_analytics.py" "$@"
        ;;
    sales)
        shift
        python3 "$SCRIPT_DIR/scripts/cc_sales.py" "$@"
        ;;
    content)
        shift
        python3 "$SCRIPT_DIR/scripts/cc_content.py" "$@"
        ;;
    monitor)
        shift
        python3 "$SCRIPT_DIR/scripts/cc_monitor.py" "$@"
        ;;
    --version|-v)
        echo "CC CLI v${VERSION}"
        ;;
    --help|-h|"")
        show_help
        ;;
    *)
        echo -e "${RED}Error: Unknown module '$1'${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac
