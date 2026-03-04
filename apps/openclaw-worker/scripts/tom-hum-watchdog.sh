#!/bin/bash
# 🦞 TÔM HÙM WATCHDOG — Never Sleep, Never Die
# External guardian that monitors CTO (task-watcher) + CC CLI (tmux brain)
# Runs as launchd agent — survives system restarts
#
# 始計→九變: "Biết địch biết ta, trăm trận trăm thắng"
# Watchdog biết trạng thái CTO + CC CLI → auto-fix ngay lập tức
#
# Version: 1.0.0 | 2026-02-20

set -e

# --- Config ---
LOG="/Users/macbookprom1/tom_hum_watchdog.log"
CTO_LOG="/Users/macbookprom1/tom_hum_cto.log"
OPENCLAW_DIR="/Users/macbookprom1/mekong-cli/apps/openclaw-worker"
MEKONG_DIR="/Users/macbookprom1/mekong-cli"
TMUX_SESSION="tom_hum:brain"
SESSION_NAME="tom_hum" # Clean name without window
CHECK_INTERVAL=30  # seconds between checks
MAX_IDLE_MINUTES=10  # max time CC CLI can be idle before force-dispatch
CC_CLI_MODEL="claude-3-opus-latest" # 🦞 FIX: Use standard ID to satisfy CC CLI name check

# --- Heartbeat config ---
HEARTBEAT_FILE="/tmp/tom_hum_heartbeat"
MAX_AGE_SECONDS=90

# --- Helpers ---
timestamp() { date '+%Y-%m-%d %H:%M:%S'; }
log() { echo "[$(timestamp)] [watchdog] $1" >> "$LOG"; }

check_heartbeat_age() {
  if [ ! -f "$HEARTBEAT_FILE" ]; then
    log "WARN: Heartbeat file missing"
    return 1
  fi
  local age=$(( $(date +%s) - $(stat -f %m "$HEARTBEAT_FILE" 2>/dev/null || echo 0) ))
  if [ "$age" -gt "$MAX_AGE_SECONDS" ]; then
    log "CRITICAL: Heartbeat stale (${age}s > ${MAX_AGE_SECONDS}s)"
    return 1
  fi
  return 0
}

# --- Core Checks ---

check_cto() {
  if pgrep -f 'node.*vibe-factory-monitor' > /dev/null 2>&1; then
    return 0  # alive
  else
    return 1  # dead
  fi
}

check_proxy() {
  # Health check the 9191 Bridge. If it's dead, the entire CC CLI and IDE will hang.
  if curl -sf --connect-timeout 3 http://localhost:9191/api/v1/health > /dev/null; then
    return 0 # alive and responding
  fi
  return 1 # dead or timing out
}

check_cc_cli() {
  # Check if tmux session exists AND has CC CLI running
  if ! tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    return 1  # no tmux session
  fi
  
  local pane_content
  pane_content=$(tmux capture-pane -t "$SESSION_NAME:brain.0" -p -S -5 2>/dev/null || echo "")
  
  if echo "$pane_content" | grep -q '❯\|Spinning\|Crunching\|Dilly-dally\|Photosynthesizing'; then
    return 0  # CC CLI alive (prompt visible or processing)
  fi
  
  # Check if claude process exists
  if pgrep -f "claude.*$CC_CLI_MODEL" > /dev/null 2>&1; then
    return 0  # process alive even if prompt not visible
  fi
  
  return 1  # no CC CLI detected
}

check_cc_cli_idle() {
  # Check if CC CLI has been idle (❯ prompt, no activity) for too long
  local pane_content
  pane_content=$(tmux capture-pane -t "$SESSION_NAME:brain.0" -p -S -5 2>/dev/null || echo "")
  
  if echo "$pane_content" | grep -qE 'Spinning|Crunching|Dilly-dally|Photosynthesizing|agents? finished|tool uses'; then
    return 1  # busy — not idle
  fi
  
  if echo "$pane_content" | grep -q '❯'; then
    return 0  # idle (prompt visible, no activity indicators)
  fi
  
  return 1  # can't determine — assume not idle
}

check_tasks_pending() {
  # Check if there are unprocessed tasks in the queue
  local task_count
  task_count=$(ls "$MEKONG_DIR/tasks/"*.txt 2>/dev/null | wc -l | tr -d ' ')
  if [ "$task_count" -gt 0 ]; then
    return 0  # tasks pending
  fi
  return 1  # no tasks
}

# --- Recovery Actions ---

restart_cto() {
  log "🔧 RESTART CTO: task-watcher process dead — restarting..."
  pkill -9 -f 'node.*vibe-factory-monitor' 2>/dev/null || true
  sleep 2
  
  # DO NOT rm -f .mission-active*.lock here! It corrupts running tmux sessions.
  
  cd "$OPENCLAW_DIR"
  nohup node scripts/vibe-factory-monitor.js > /dev/null 2>&1 &
  disown
  local pid=$!
  log "✅ CTO RESTARTED: PID=$pid"
  sleep 5
  
  # Verify
  if check_cto; then
    log "✅ CTO VERIFIED: Running healthy"
  else
    log "❌ CTO RESTART FAILED: Process not found after restart!"
  fi
}

restart_cc_cli() {
  log "🔧 RESTART CC CLI: Brain dead in tmux — respawning..."
  
  # Kill old session
  tmux kill-session -t "$SESSION_NAME" 2>/dev/null || true
  sleep 1
  
  # Delegate to standard boot sequence to create 3 panes (P0, P1, P2)
  cd "$OPENCLAW_DIR"
  node -e "require('./lib/brain-boot-sequence.js').spawnBrain().then(()=>console.log('SPAWNED')).catch(console.error)" > /dev/null 2>&1
  
  log "✅ CC CLI SPAWNED (3 Panes): Waiting 15s for boot..."
  sleep 15
  
  # Verify
  if check_cc_cli; then
    log "✅ CC CLI VERIFIED: Running healthy"
  else
    log "⚠️ CC CLI: Process started but prompt not detected yet — CTO will manage"
  fi
}

nudge_cto() {
  # CC CLI is idle and tasks are pending — CTO should be dispatching!
  # Or: CC CLI idle + NO tasks → CTO needs to generate new tasks via scanner
  log "🔨 NUDGE CTO: CC CLI idle — forcing CTO restart for fresh scan + dispatch..."
  
  # Check if it's idle+empty or idle+pending
  if check_tasks_pending; then
    log "📋 Tasks PENDING but CC CLI idle → CTO lock stuck → restart CTO"
  else
    log "📋 Queue EMPTY — triggering immediate project scan to generate new tasks"
  fi
  
  restart_cto  # CTO boot runs startScanner() → immediate runFullScan()
}

restart_proxy() {
  # 🦞 FIX 2026-02-27: Disabled manual proxy launch (proxy-lan-start.sh).
  # We now rely entirely on the PM2 `antigravity` process to manage port 9191.
  # This prevents EADDRINUSE conflicts and ensures `minhlong.rice` config persists.
  log "🌐 RESTART PROXY: Skipped manual launch. Relying on PM2 antigravity service."
}

# --- Hardware Monitoring ---
check_hardware() {
  local thermal_log="/Users/macbookprom1/tom_hum_thermal.log"
  if [ -f "$thermal_log" ]; then
    local last_line
    last_line=$(tail -n 1 "$thermal_log")
    # Extract metrics using grep/sed
    local load=$(echo "$last_line" | grep -o 'load=[0-9.]*' | cut -d= -f2)
    local ram=$(echo "$last_line" | grep -o 'ram=[0-9.]*MB' | cut -d= -f2)
    local pwr=$(echo "$last_line" | grep -o 'pwr=[A-Z]*([0-9]*%)' | cut -d= -f2)
    local swap=$(echo "$last_line" | grep -o 'swap=[0-9.]*M' | cut -d= -f2)
    echo "LOAD=$load | RAM=$ram | SWAP=$swap | PWR=$pwr"
  else
    echo "HW_LOG=NOT_FOUND"
  fi
}

# --- Health Report ---
health_report() {
  local cto_status cc_status tasks_status proxy_status hw_status heartbeat_status

  check_cto && cto_status="✅ ALIVE" || cto_status="❌ DEAD"
  check_cc_cli && cc_status="✅ ALIVE" || cc_status="❌ DEAD"
  check_proxy && proxy_status="✅ ALIVE" || proxy_status="❌ DEAD"
  check_tasks_pending && tasks_status="📋 PENDING" || tasks_status="✅ CLEAR"
  check_heartbeat_age && heartbeat_status="✅ FRESH" || heartbeat_status="⚠️ STALE"
  hw_status=$(check_hardware)

  log "HEALTH: PROXY=$proxy_status | CTO=$cto_status | CC_CLI=$cc_status | HEARTBEAT=$heartbeat_status | Tasks=$tasks_status | HW: $hw_status"
}

# --- Main Loop ---
log "🦞 ═══════════════════════════════════════"
log "🦞 TÔM HÙM WATCHDOG v1.0 STARTED"
log "🦞 Interval: ${CHECK_INTERVAL}s | Idle threshold: ${MAX_IDLE_MINUTES}min"
log "🦞 ═══════════════════════════════════════"

idle_start_time=0
health_report_counter=0

while true; do
  # --- Check Proxy LAN ---
  if ! check_proxy; then
    log "⚠️ PROXY 20128 DEAD OR HUNG — initiating recovery..."
    restart_proxy
    sleep 5
  fi

  # --- Check CTO ---
  if ! check_cto; then
    log "⚠️ CTO DEAD — initiating restart..."
    restart_cto
    sleep 10  # give CTO time to boot + dispatch
  fi
  
  # --- Check CC CLI ---
  if ! check_cc_cli; then
    log "⚠️ CC CLI DEAD — initiating respawn..."
    restart_cc_cli
    idle_start_time=0  # reset idle timer
    sleep 10  # give CC CLI time to boot
  fi
  
  # --- Check idle (with or without pending tasks) ---
  # CC CLI idle → either stuck lock (tasks pending) OR queue depleted (need scanner)
  if check_cc_cli_idle; then
    if [ "$idle_start_time" -eq 0 ]; then
      idle_start_time=$(date +%s)
      log "📊 CC CLI idle — starting idle timer"
    else
      now=$(date +%s)
      idle_minutes=$(( (now - idle_start_time) / 60 ))
      
      if [ "$idle_minutes" -ge "$MAX_IDLE_MINUTES" ]; then
        log "⚠️ CC CLI IDLE ${idle_minutes}min — nudging CTO!"
        nudge_cto
        idle_start_time=0  # reset timer
      fi
    fi
  else
    idle_start_time=0  # CC CLI is busy — reset timer
  fi
  
  # --- Periodic health report (every 5 minutes) ---
  health_report_counter=$((health_report_counter + 1))
  if [ "$health_report_counter" -ge $(( 300 / CHECK_INTERVAL )) ]; then
    health_report
    health_report_counter=0
  fi
  
  sleep "$CHECK_INTERVAL"
done
