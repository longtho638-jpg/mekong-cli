#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# 🏯 DOANH TRẠI KHỞI ĐỘNG — Swarm Boot Protocol
# ═══════════════════════════════════════════════════════════════
#
# "Binh quý tinh, bất quý đa" — Quân quý ở tinh nhuệ
#
# Standardized boot script for OpenClaw Swarm
# Usage: ./swarm.sh [start|stop|status|restart]
# ═══════════════════════════════════════════════════════════════

set -e

MEKONG_DIR="${MEKONG_DIR:-/Users/macbookprom1/mekong-cli}"
OPENCLAW_DIR="$MEKONG_DIR/apps/openclaw-worker"
TASKS_DIR="$MEKONG_DIR/tasks"
PROCESSED_DIR="$MEKONG_DIR/tasks/processed"
TOM_HUM_LOG="${TOM_HUM_LOG:-$HOME/tom_hum_cto.log}"
TMUX_SESSION="tom_hum_brain"
PID_DIR="/tmp/tom_hum_pids"

# ═══════════════════════════════════════
# 11 Daemons — DOANH TRAI Org Chart
# ═══════════════════════════════════════
# Echelon 1: TIỀN ĐỘI (Front Line — High Frequency)
# Echelon 2: TRUNG QUÂN (Core Force — Medium Frequency)
# Echelon 3: HẬU CẦN (Support — Low Frequency)
# Echelon 4: THAM MƯU (Intelligence — Deep Thinking)

TIEN_DOI=(hunter dispatcher operator)
TRUNG_QUAN=(builder reviewer scribe)
HAU_CAN=(diplomat merchant artist)
THAM_MUU=(architect sage)
ALL_DAEMONS=("${TIEN_DOI[@]}" "${TRUNG_QUAN[@]}" "${HAU_CAN[@]}" "${THAM_MUU[@]}")

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log() {
  echo -e "${CYAN}[🏯 DOANH TRẠI]${NC} $1"
}
ok() {
  echo -e "${GREEN}[✅]${NC} $1"
}
warn() {
  echo -e "${YELLOW}[⚠️]${NC} $1"
}
err() {
  echo -e "${RED}[❌]${NC} $1"
}

# Helper: Start a single daemon
start_daemon() {
  local name=$1
  local daemon_file="$OPENCLAW_DIR/${name}-daemon.js"
  local log_file="$HOME/tom_hum_${name}.log"
  local pid_file="$PID_DIR/${name}.pid"

  if [ ! -f "$daemon_file" ]; then
    err "$name: File not found ($daemon_file)"
    return 1
  fi

  nohup node "$daemon_file" >> "$log_file" 2>&1 &
  local pid=$!
  echo "$pid" > "$pid_file"
  ok "$name (PID: $pid)"
}

# Helper: Stop a single daemon
stop_daemon() {
  local name=$1
  local pid_file="$PID_DIR/${name}.pid"

  if [ -f "$pid_file" ]; then
    local pid
    pid=$(cat "$pid_file")
    kill "$pid" 2>/dev/null && ok "$name stopped (PID: $pid)" || warn "$name already stopped"
    rm -f "$pid_file"
  fi
  pkill -f "${name}-daemon.js" 2>/dev/null || true
}

# Helper: Check status of a single daemon
check_daemon() {
  local name=$1
  local pid_file="$PID_DIR/${name}.pid"

  if [ -f "$pid_file" ] && kill -0 "$(cat "$pid_file")" 2>/dev/null; then
    ok "$name: Running (PID: $(cat "$pid_file"))"
  else
    err "$name: Not running"
  fi
}

# ═══════════════════════════════════════
# 始計 (Shi Ji) — Pre-boot Assessment
# ═══════════════════════════════════════

preboot_check() {
  log "始計 Assessment — Kiểm tra trước khi khởi động..."

  # 1. ĐẠO — Check required files exist
  if [ ! -f "$OPENCLAW_DIR/task-watcher.js" ]; then
    err "task-watcher.js not found. ĐẠO FAILED."
    exit 1
  fi
  ok "ĐẠO: Core files present"

  # 2. THIÊN — Check Antigravity Proxy
  if curl -s --max-time 2 http://127.0.0.1:9191/health > /dev/null 2>&1; then
    ok "THIÊN: AG Ultra Proxy running on :9191 (2 Ultra accounts)"
  else
    warn "THIÊN: AG Ultra Proxy not detected on :9191 — starting..."
    PORT=9191 nohup antigravity-claude-proxy start > $MEKONG_DIR/logs/ag-proxy.log 2>&1 &
    sleep 3
  fi

  # 3. ĐỊA — Check directories
  mkdir -p "$TASKS_DIR" "$PROCESSED_DIR" 2>/dev/null
  ok "ĐỊA: Task directories ready"

  # 4. TƯỚNG — Check Node.js
  if command -v node > /dev/null 2>&1; then
    NODE_VER=$(node -v)
    ok "TƯỚNG: Node.js $NODE_VER"
  else
    err "TƯỚNG: Node.js not found. Install Node.js first."
    exit 1
  fi

  # 5. PHÁP — Check CC CLI
  if command -v claude > /dev/null 2>&1; then
    ok "PHÁP: CC CLI available"
  else
    warn "PHÁP: CC CLI not found in PATH (will try to find in brain-tmux)"
  fi

  echo ""
}

# ═══════════════════════════════════════
# 軍爭 (Jun Zheng) — Start Operations
# ═══════════════════════════════════════

start_swarm() {
  log "軍爭 — Khởi động Doanh Trại Tôm Hùm..."
  echo ""

  # Create PID directory
  mkdir -p "$PID_DIR"

  # Kill any existing sessions cleanly
  tmux kill-session -t "$TMUX_SESSION" 2>/dev/null || true
  sleep 1

  # Phase 0: Start task-watcher (manages tmux brain internally)
  log "Phase 0: Khởi động Tôm Hùm Task Watcher (VISUAL MODE: 4 SCREENS)..."
  # FIXED: Enforce TMUX mode for 4-screen layout
  TOM_HUM_BRAIN_MODE=tmux nohup node "$OPENCLAW_DIR/task-watcher.js" >> "$TOM_HUM_LOG" 2>&1 &
  TW_PID=$!
  echo "$TW_PID" > "$PID_DIR/task-watcher.pid"
  ok "Task Watcher started (PID: $TW_PID) [Mode: Visual/Tmux]"

  # Wait for tmux session to be ready (brain-tmux creates it)
  log "Đợi Brain-Tmux khởi tạo..."
  for i in $(seq 1 30); do
    if tmux has-session -t "$TMUX_SESSION" 2>/dev/null; then
      ok "Brain-Tmux session ready!"
      break
    fi
    sleep 2
  done

  if ! tmux has-session -t "$TMUX_SESSION" 2>/dev/null; then
    warn "Brain-Tmux session chưa sẵn sàng sau 60s — kiểm tra logs"
  fi

  # Phase 1: TIỀN ĐỘI — Front Line (High Frequency)
  echo ""
  log "Phase 1: ⚔️ TIỀN ĐỘI — Front Line..."
  for daemon in "${TIEN_DOI[@]}"; do
    start_daemon "$daemon"
  done

  # Phase 2: TRUNG QUÂN — Core Force (Medium Frequency)
  echo ""
  log "Phase 2: 🔨 TRUNG QUÂN — Core Force..."
  for daemon in "${TRUNG_QUAN[@]}"; do
    start_daemon "$daemon"
  done

  # Phase 3: HẬU CẦN — Support (Low Frequency)
  echo ""
  log "Phase 3: 🎓 HẬU CẦN — Support..."
  for daemon in "${HAU_CAN[@]}"; do
    start_daemon "$daemon"
  done

  # Phase 4: THAM MƯU — Intelligence (Deep Thinking)
  echo ""
  log "Phase 4: 📚 THAM MƯU — Intelligence..."
  for daemon in "${THAM_MUU[@]}"; do
    start_daemon "$daemon"
  done

  echo ""
  log "═══════════════════════════════════════"
  log "🏯 DOANH TRẠI TÔM HÙM — ONLINE! (11 daemons)"
  log "═══════════════════════════════════════"
  echo ""
  log "📋 Logs:"
  log "  Task Watcher: tail -f $TOM_HUM_LOG"
  for daemon in "${ALL_DAEMONS[@]}"; do
    log "  $daemon: tail -f $HOME/tom_hum_${daemon}.log"
  done
  echo ""
  log "🖥️  Tmux: tmux attach -t $TMUX_SESSION"
  echo ""
}

# ═══════════════════════════════════════
# 走為上計 — Stop (Tactical Retreat)
# ═══════════════════════════════════════

stop_swarm() {
  log "走為上計 — Tẩu vi thượng sách (Graceful Shutdown)..."

  # Kill task-watcher
  if [ -f "$PID_DIR/task-watcher.pid" ]; then
    TW_PID=$(cat "$PID_DIR/task-watcher.pid")
    kill "$TW_PID" 2>/dev/null && ok "Task Watcher stopped (PID: $TW_PID)" || warn "Task Watcher already stopped"
    rm -f "$PID_DIR/task-watcher.pid"
  fi
  pkill -f "task-watcher.js" 2>/dev/null || true

  # Kill all 11 daemons
  for daemon in "${ALL_DAEMONS[@]}"; do
    stop_daemon "$daemon"
  done

  # Kill tmux session
  tmux kill-session -t "$TMUX_SESSION" 2>/dev/null && ok "Tmux session killed" || warn "No tmux session found"

  log "Doanh trại đã đóng. 將軍 nghỉ ngơi."
}

# ═══════════════════════════════════════
# 行軍 (Xing Jun) — Status Check
# ═══════════════════════════════════════

status_swarm() {
  log "行軍 — Kiểm tra quân tình..."
  echo ""

  # Tmux
  if tmux has-session -t "$TMUX_SESSION" 2>/dev/null; then
    PANE_COUNT=$(tmux list-panes -t "$TMUX_SESSION" 2>/dev/null | wc -l)
    ok "Tmux: $TMUX_SESSION ($PANE_COUNT panes)"
  else
    err "Tmux: No session found"
  fi

  # Task Watcher
  if [ -f "$PID_DIR/task-watcher.pid" ] && kill -0 "$(cat "$PID_DIR/task-watcher.pid")" 2>/dev/null; then
    ok "Task Watcher: Running (PID: $(cat "$PID_DIR/task-watcher.pid"))"
  else
    err "Task Watcher: Not running"
  fi

  # TIỀN ĐỘI
  echo ""
  log "⚔️ TIỀN ĐỘI — Front Line:"
  for daemon in "${TIEN_DOI[@]}"; do
    check_daemon "$daemon"
  done

  # TRUNG QUÂN
  echo ""
  log "🔨 TRUNG QUÂN — Core Force:"
  for daemon in "${TRUNG_QUAN[@]}"; do
    check_daemon "$daemon"
  done

  # HẬU CẦN
  echo ""
  log "🎓 HẬU CẦN — Support:"
  for daemon in "${HAU_CAN[@]}"; do
    check_daemon "$daemon"
  done

  # THAM MƯU
  echo ""
  log "📚 THAM MƯU — Intelligence:"
  for daemon in "${THAM_MUU[@]}"; do
    check_daemon "$daemon"
  done

  # Proxy
  echo ""
  if curl -s --max-time 2 http://127.0.0.1:9191/health > /dev/null 2>&1; then
    ok "AG Ultra Proxy: Online (:9191)"
  else
    warn "AG Ultra Proxy: Offline (:9191)"
  fi

  # Queue
  if [ -d "$TASKS_DIR" ]; then
    PENDING=$(ls "$TASKS_DIR"/*.txt 2>/dev/null | wc -l)
    echo ""
    log "📋 Queue: $PENDING pending missions"
  fi
}

# ═══════════════════════════════════════
# Main
# ═══════════════════════════════════════

case "${1:-start}" in
  start)
    preboot_check
    start_swarm
    ;;
  stop)
    stop_swarm
    ;;
  restart)
    stop_swarm
    sleep 2
    preboot_check
    start_swarm
    ;;
  status)
    status_swarm
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|status}"
    exit 1
    ;;
esac
