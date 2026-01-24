#!/bin/bash
# CC Revenue CLI Wrapper
# Usage: ./cc revenue [command] [options]

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

if [ "$1" == "revenue" ]; then
    shift
    python3 "$SCRIPT_DIR/scripts/cc_revenue.py" "$@"
else
    echo "Usage: ./cc revenue [summary|affiliates|forecast|export] [options]"
    echo ""
    echo "Commands:"
    echo "  summary      Display revenue summary by time period"
    echo "  affiliates   Display affiliate commission report"
    echo "  forecast     AI-powered revenue forecast"
    echo "  export       Export revenue data to CSV"
    echo ""
    echo "Run './cc revenue --help' for more information"
fi
