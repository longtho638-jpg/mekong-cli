#!/bin/bash
# =============================================================================
# 🔄 Antigravity Auto-Retry Daemon
# Automatically retries on agent termination errors
# =============================================================================

set -e

# Configuration
MAX_RETRIES=5
RETRY_DELAYS=(1 2 4 8 16)  # Exponential backoff
LOG_FILE="$HOME/.mekong/logs/auto-retry.log"
LOCK_FILE="/tmp/antigravity-auto-retry.lock"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

log() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

# Check if another instance is running
if [ -f "$LOCK_FILE" ]; then
    pid=$(cat "$LOCK_FILE")
    if kill -0 "$pid" 2>/dev/null; then
        log "WARN" "Another auto-retry instance is running (PID: $pid)"
        exit 1
    fi
fi

# Create lock file
echo $$ > "$LOCK_FILE"
trap "rm -f $LOCK_FILE" EXIT

# Function to check Antigravity health
check_antigravity_health() {
    # Check if Antigravity CLI is responsive
    if /Applications/Antigravity.app/Contents/Resources/app/bin/antigravity --version >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to restart Antigravity
restart_antigravity() {
    log "INFO" "🔄 Restarting Antigravity..."
    
    # Kill existing processes gracefully
    pkill -f "Antigravity" 2>/dev/null || true
    sleep 2
    
    # Start fresh
    open -a "Antigravity"
    sleep 5
    
    if check_antigravity_health; then
        log "INFO" "✅ Antigravity restarted successfully"
        return 0
    else
        log "ERROR" "❌ Antigravity failed to restart"
        return 1
    fi
}

# Main auto-retry function
auto_retry_on_error() {
    local attempt=0
    
    log "INFO" "🏯 Antigravity Auto-Retry Daemon Started"
    log "INFO" "Max retries: $MAX_RETRIES | Delays: ${RETRY_DELAYS[*]}s"
    
    while [ $attempt -lt $MAX_RETRIES ]; do
        if check_antigravity_health; then
            log "INFO" "✅ Antigravity is healthy"
            attempt=0  # Reset counter on success
            sleep 30   # Check every 30 seconds
        else
            attempt=$((attempt + 1))
            delay=${RETRY_DELAYS[$((attempt - 1))]}
            
            log "WARN" "⚠️ Antigravity unhealthy - Retry $attempt/$MAX_RETRIES (waiting ${delay}s)"
            sleep "$delay"
            
            if ! restart_antigravity; then
                log "ERROR" "❌ Restart failed on attempt $attempt"
            else
                log "INFO" "✅ Recovered on attempt $attempt"
                attempt=0  # Reset on successful recovery
            fi
        fi
    done
    
    log "ERROR" "💀 Max retries ($MAX_RETRIES) exceeded. Manual intervention required."
    
    # Send notification (macOS)
    osascript -e 'display notification "Antigravity auto-retry exhausted. Manual restart needed." with title "🚨 Antigravity Error"' 2>/dev/null || true
    
    return 1
}

# Parse arguments
case "${1:-}" in
    "start")
        log "INFO" "🚀 Starting Auto-Retry Daemon"
        auto_retry_on_error &
        echo $! > "$LOCK_FILE"
        log "INFO" "Daemon started with PID: $(cat $LOCK_FILE)"
        ;;
    "stop")
        if [ -f "$LOCK_FILE" ]; then
            kill $(cat "$LOCK_FILE") 2>/dev/null || true
            rm -f "$LOCK_FILE"
            log "INFO" "🛑 Daemon stopped"
        else
            log "WARN" "No daemon running"
        fi
        ;;
    "status")
        if [ -f "$LOCK_FILE" ] && kill -0 $(cat "$LOCK_FILE") 2>/dev/null; then
            echo -e "${GREEN}✅ Auto-Retry Daemon is running (PID: $(cat $LOCK_FILE))${NC}"
        else
            echo -e "${RED}❌ Auto-Retry Daemon is not running${NC}"
        fi
        ;;
    "restart")
        $0 stop
        sleep 2
        $0 start
        ;;
    "once")
        # Single retry attempt (for immediate use)
        log "INFO" "🔄 Single retry triggered"
        restart_antigravity
        ;;
    *)
        echo "Usage: $0 {start|stop|status|restart|once}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the auto-retry daemon"
        echo "  stop    - Stop the daemon"
        echo "  status  - Check daemon status"
        echo "  restart - Restart the daemon"
        echo "  once    - Perform single retry now"
        exit 1
        ;;
esac
