#!/bin/bash
# CC CLI Safe Runner - Prevents OOM crashes
# Usage: ./scripts/cc-cli-safe.sh [task_range] [prompt]
# Example: ./scripts/cc-cli-safe.sh "10-14" "Execute Tasks 10-14"

set -e

# === CONFIGURATION ===
MAX_MEMORY_GB=16
MAX_RUNTIME_MINUTES=30
BATCH_SIZE=5
LOG_DIR="$HOME/.claude/logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# === FUNCTIONS ===

log() {
    echo -e "${BLUE}[CC-SAFE]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

check_memory() {
    # Get available memory in GB
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS - use sysctl for total memory and ps for used
        TOTAL_MEM=$(sysctl -n hw.memsize)
        TOTAL_GB=$(echo "scale=2; $TOTAL_MEM / 1024 / 1024 / 1024" | bc)
        # Get free pages more reliably
        FREE_PAGES=$(vm_stat | awk '/Pages free/ {gsub(/\./,"",$3); print $3}')
        INACTIVE_PAGES=$(vm_stat | awk '/Pages inactive/ {gsub(/\./,"",$3); print $3}')
        PAGE_SIZE=4096
        FREE_GB=$(echo "scale=2; ($FREE_PAGES + $INACTIVE_PAGES) * $PAGE_SIZE / 1024 / 1024 / 1024" | bc 2>/dev/null || echo "8")
    else
        # Linux
        FREE_GB=$(free -g | awk '/^Mem:/{print $4}')
    fi
    
    log "Total memory: ${TOTAL_GB:-16}GB, Available: ${FREE_GB:-8}GB"
    
    # Be more lenient - just warn instead of blocking
    if (( $(echo "${FREE_GB:-8} < 2" | bc -l 2>/dev/null || echo 0) )); then
        warn "Low memory detected, but continuing anyway..."
    fi
    
    return 0
}

cleanup_node() {
    log "Cleaning up stale Node processes..."
    pkill -f "claude" 2>/dev/null || true
    pkill -f "node.*claude" 2>/dev/null || true
    
    # Clear Node.js cache
    if [[ -d "$HOME/.npm/_cacache" ]]; then
        log "Clearing npm cache..."
        npm cache clean --force 2>/dev/null || true
    fi
}

run_cc_cli() {
    local PROMPT="$1"
    local TASK_RANGE="$2"
    
    # Set memory limit
    export NODE_OPTIONS="--max-old-space-size=$((MAX_MEMORY_GB * 1024))"
    
    # Create log file
    mkdir -p "$LOG_DIR"
    local LOG_FILE="$LOG_DIR/cc-cli-$TIMESTAMP.log"
    
    log "Starting CC CLI with ${MAX_MEMORY_GB}GB memory limit"
    log "Max runtime: ${MAX_RUNTIME_MINUTES} minutes"
    log "Log file: $LOG_FILE"
    
    # Run with timeout
    timeout "${MAX_RUNTIME_MINUTES}m" claude \
        --model gemini-3-pro-high \
        --dangerously-skip-permissions \
        -p "$PROMPT" \
        2>&1 | tee "$LOG_FILE" &
    
    local PID=$!
    
    # Monitor memory usage
    while kill -0 $PID 2>/dev/null; do
        sleep 30
        
        # Check if process is using too much memory
        if [[ "$OSTYPE" == "darwin"* ]]; then
            MEM_USAGE=$(ps -o rss= -p $PID 2>/dev/null | awk '{print $1/1024/1024}')
        else
            MEM_USAGE=$(ps -o rss= -p $PID 2>/dev/null | awk '{print $1/1024/1024}')
        fi
        
        if [[ -n "$MEM_USAGE" ]]; then
            log "Memory usage: ${MEM_USAGE}GB"
            
            # Warning at 80% of limit
            if (( $(echo "$MEM_USAGE > $MAX_MEMORY_GB * 0.8" | bc -l) )); then
                warn "High memory usage! Consider restarting soon."
            fi
            
            # Emergency stop at 95%
            if (( $(echo "$MEM_USAGE > $MAX_MEMORY_GB * 0.95" | bc -l) )); then
                error "Critical memory usage! Stopping to prevent crash..."
                kill -TERM $PID 2>/dev/null
                sleep 2
                kill -KILL $PID 2>/dev/null || true
                return 2
            fi
        fi
    done
    
    wait $PID
    local EXIT_CODE=$?
    
    if [[ $EXIT_CODE -eq 0 ]]; then
        success "CC CLI completed successfully!"
    elif [[ $EXIT_CODE -eq 124 ]]; then
        warn "CC CLI timed out after ${MAX_RUNTIME_MINUTES} minutes"
    else
        error "CC CLI exited with code: $EXIT_CODE"
    fi
    
    return $EXIT_CODE
}

batch_execute() {
    local TASK_FILE="$1"
    local START_TASK="$2"
    local END_TASK="$3"
    
    log "Batch executing Tasks $START_TASK to $END_TASK"
    
    for ((i=START_TASK; i<=END_TASK; i+=BATCH_SIZE)); do
        local BATCH_END=$((i + BATCH_SIZE - 1))
        if [[ $BATCH_END -gt $END_TASK ]]; then
            BATCH_END=$END_TASK
        fi
        
        log "=== Batch: Tasks $i-$BATCH_END ==="
        
        # Clean up before each batch
        cleanup_node
        check_memory || exit 1
        
        # Run batch
        local PROMPT="/build Execute Tasks $i to $BATCH_END from $TASK_FILE. Mark completed tasks with [x]. Stop after completing this batch."
        
        run_cc_cli "$PROMPT" "$i-$BATCH_END"
        local RESULT=$?
        
        if [[ $RESULT -eq 2 ]]; then
            warn "Memory emergency stop. Waiting 30s before retry..."
            sleep 30
            cleanup_node
            # Retry this batch
            ((i-=BATCH_SIZE))
            continue
        fi
        
        success "Batch $i-$BATCH_END completed!"
        
        # Cool down between batches
        log "Cooling down for 10 seconds..."
        sleep 10
    done
    
    success "All batches completed!"
}

# === MAIN ===

main() {
    echo ""
    echo "╔════════════════════════════════════════════════╗"
    echo "║     CC CLI Safe Runner v1.0                    ║"
    echo "║     Prevents OOM crashes with smart batching   ║"
    echo "╚════════════════════════════════════════════════╝"
    echo ""
    
    # Parse arguments
    local TASK_RANGE="${1:-10-34}"
    local CUSTOM_PROMPT="$2"
    
    # Parse range
    local START_TASK=$(echo $TASK_RANGE | cut -d'-' -f1)
    local END_TASK=$(echo $TASK_RANGE | cut -d'-' -f2)
    
    log "Task range: $START_TASK to $END_TASK"
    log "Batch size: $BATCH_SIZE tasks per session"
    log "Memory limit: ${MAX_MEMORY_GB}GB"
    log "Max runtime per batch: ${MAX_RUNTIME_MINUTES} minutes"
    
    # Pre-flight checks
    check_memory || exit 1
    cleanup_node
    
    # Task file
    local TASK_FILE="$HOME/.gemini/antigravity/brain/7afe7e33-37ac-4853-b18f-2e765a007e22/task.md"
    
    if [[ -n "$CUSTOM_PROMPT" ]]; then
        # Single run with custom prompt
        run_cc_cli "$CUSTOM_PROMPT"
    else
        # Batch execution
        batch_execute "$TASK_FILE" "$START_TASK" "$END_TASK"
    fi
}

main "$@"
