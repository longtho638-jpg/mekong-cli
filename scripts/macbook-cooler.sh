#!/bin/bash
# ❄️ MacBook Cooler - Infinite Background Loop
# Tự động hạ nhiệt mỗi 5 phút, KHÔNG ảnh hưởng tasks đang chạy
# Chạy: nohup ./scripts/macbook-cooler.sh &
# Dừng: kill $(cat /tmp/cooler.pid)

INTERVAL=300
LOG="/tmp/cooler.log"
PIDFILE="/tmp/cooler.pid"

echo $$ > "$PIDFILE"

log() {
  echo "[$(date '+%H:%M:%S')] $1" >> "$LOG"
}

cleanup_caches() {
  # .next caches of inactive projects
  for nextdir in /Users/macbookprom1/mekong-cli/apps/*/.next; do
    [ -d "$nextdir" ] || continue
    local proj
    proj=$(basename "$(dirname "$nextdir")")
    if ! pgrep -f "$proj.*next" > /dev/null 2>&1; then
      rm -rf "$nextdir" 2>/dev/null
      log "  🧹 .next cleared: $proj"
    fi
  done
  # tmp junk
  rm -rf /tmp/next-* /tmp/vitest-* /tmp/vscode-typescript* 2>/dev/null
}

kill_zombies() {
  # turbo daemon
  pgrep -f "turbo.*daemon" | while read -r pid; do
    kill -9 "$pid" 2>/dev/null && log "  ☠️ Killed turbo daemon ($pid)"
  done
  # pyrefly eating CPU
  pgrep -f "pyrefly" | while read -r pid; do
    local cpu
    cpu=$(ps -p "$pid" -o %cpu= 2>/dev/null | tr -d ' ' | cut -d. -f1)
    if [ "${cpu:-0}" -gt 20 ]; then
      kill -9 "$pid" 2>/dev/null && log "  ☠️ Killed pyrefly ($pid, ${cpu}%)"
    fi
  done
}

# === MAIN LOOP ===
log "❄️ Cooler started (PID: $$)"

CYCLE=0
while true; do
  CYCLE=$((CYCLE + 1))
  LOAD=$(sysctl -n vm.loadavg 2>/dev/null | awk '{print $2}' | cut -d. -f1)
  MEM_LINE=$(top -l 1 -s 0 2>/dev/null | grep "PhysMem")
  RAM_UNUSED=$(echo "$MEM_LINE" | grep -o '[0-9]*M unused' | grep -o '[0-9]*')

  log "🔄 #$CYCLE | Load: ${LOAD:-?} | RAM Free: ${RAM_UNUSED:-?}MB"

  # Always: light cleanup
  cleanup_caches

  # Load > 8: kill zombies
  if [ "${LOAD:-0}" -gt 8 ]; then
    log "  ⚠️ High load - killing zombies"
    kill_zombies
  fi

  # RAM < 200MB: purge
  if [ "${RAM_UNUSED:-999}" -lt 200 ]; then
    log "  🔴 Low RAM - purging"
    sudo purge 2>/dev/null && log "  ✅ Purged" || true
  fi

  log "---"
  sleep "$INTERVAL"
done
