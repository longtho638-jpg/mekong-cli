#!/bin/bash
# 🏥 SUPREME HEALER v1.0 - Binh Pháp Immortal Guardian
# Purpose: Auto-monitor and auto-heal all autonomous loop components.

MEKONG_DIR="/Users/macbookprom1/mekong-cli"
LOG_FILE="$MEKONG_DIR/logs/supreme_healer.log"
TASKS_DIR="$MEKONG_DIR/tasks"
QWEN_BRIDGE="$MEKONG_DIR/scripts/qwen_bridge.py"
TASK_WATCHER="$MEKONG_DIR/apps/openclaw-worker/task-watcher.js"
IMMORTAL_LOOP="$MEKONG_DIR/src/binh_phap/immortal_loop.py"

mkdir -p "$MEKONG_DIR/logs"

log() {
    echo "[$(date '+%H:%M:%S')] 🏥 $1" | tee -a "$LOG_FILE"
}

check_service() {
    local name=$1
    local pattern=$2
    local restart_cmd=$3
    
    if ! pgrep -f "$pattern" > /dev/null; then
        log "CRITICAL: $name is DOWN! Restarting..."
        eval "$restart_cmd"
    else
        log "Status: $name is ALIVE."
    fi
}

check_port() {
    local name=$1
    local port=$2
    local restart_cmd=$3
    
    if ! lsof -i :$port > /dev/null; then
        log "CRITICAL: Port $port ($name) is NOT LISTENING! Restarting..."
        eval "$restart_cmd"
    else
        log "Status: Port $port ($name) is ACTIVE."
    fi
}

# --- HEALING LOOP ---
log "--- SUPREME HEALER ONLINE ---"

while true; do
    # 1. Check AG Proxy (Port 9191) — antigravity-claude-proxy (2 Ultra accounts)
    check_port "AG Proxy (antigravity-claude-proxy)" 9191 "PORT=9191 nohup antigravity-claude-proxy start > $MEKONG_DIR/logs/ag-proxy.log 2>&1 &"
    
    # 2. Check Qwen Bridge
    check_port "Qwen Bridge" 8081 "nohup python3 -u $QWEN_BRIDGE > $MEKONG_DIR/logs/qwen_bridge.log 2>&1 &"
    
    # 3. Check Task Watcher
    check_service "Task Watcher" "task-watcher.js" "nohup node $TASK_WATCHER > $MEKONG_DIR/logs/task_watcher.log 2>&1 &"
    
    # 4. Check Immortal Loop (Auditor)
    # We use -f to distinguish from other python scripts
    if ! pgrep -f "immortal_loop.py" > /dev/null; then
        log "WARNING: Immortal Loop Auditor is DOWN. Starting..."
        # Run in a separate terminal or background
        nohup python3 $IMMORTAL_LOOP > $MEKONG_DIR/logs/immortal_loop.log 2>&1 &
    fi

    # 5. TODO: Implement Terminal Hang Detection
    # If the last mission in processed/ has a timestamp > 15 mins old but tasks/ is empty and score < 100
    # Or if 'claude' process is high CPU but no log update.

    log "--- All systems checked. Sleeping for 30s ---"
    sleep 30
done
