#!/bin/bash
# FACTORY LOOP v7.0 — CTO THƯỢNG TẦNG: 6-LAYER CASCADE DISPATCH
# Dispatches via mekong CLI engine's 6-layer pyramid:
#   🏯 Studio → 👑 Founder → 💼 Business → 🎯 Product → ⚙️ Engineering → 🔧 Ops
# Tasks from queue are classified to correct LAYER, then dispatched as mekong commands.
# Date: 2026-03-15 | Aligned with CLAUDE.md v6.0 + factory/layers.yaml
set -euo pipefail

TMUX_SESSION="tom_hum"
PANES=(0 1)
PANE_PROJECTS=("sophia-proposal" "well")
QUEUE_DIR="/Users/macbookprom1/mekong-cli/tasks"
SLEEP_INTERVAL=120

echo "🏭 FACTORY LOOP v7.0 — 6-LAYER CASCADE — $(date) — PID: $$"
echo "🏛️ Layers: Studio → Founder → Business → Product → Engineering → Ops"
echo "🏛️ PANES: P0=${PANE_PROJECTS[0]}, P1=${PANE_PROJECTS[1]}"

# ═══════════════════════════════════════════════════════════════
# 6-LAYER COMMAND CLASSIFIER — from factory/layers.yaml
# Rules:
#   1. If task already has /command prefix → use as-is
#   2. Classify by keywords to correct layer
#   3. Super-commands (/studio:*) cascade through all layers
#   4. CRITICAL: Dispatch via mekong CLI engine, NO manual file ops
# ═══════════════════════════════════════════════════════════════
classify_command() {
  local TASK="$1"
  local LOWER=$(echo "$TASK" | tr '[:upper:]' '[:lower:]')

  # Already a slash command? Use as-is
  if [[ "$TASK" =~ ^/ ]]; then
    echo "$TASK"
    return
  fi

  # 🏯 STUDIO (Layer 1 — VC/Portfolio/Venture) — cascades through ALL layers
  if echo "$LOWER" | grep -qE "portfolio|venture|deal.?flow|studio|expert.?match|diligence|thesis"; then
    echo "/studio:operate:daily $TASK"
    return
  fi

  # 👑 FOUNDER (Layer 2 — Strategy/OKR/Finance) — cascades to Business→Product→Eng→Ops
  if echo "$LOWER" | grep -qE "okr|fundraise|swot|annual|pitch|ipo|cap.?table|investor|runway|strategy|chiến lược"; then
    echo "/founder-week $TASK"
    return
  fi

  # 💼 BUSINESS (Layer 3 — Sales/Marketing/Revenue) — cascades to Product→Eng→Ops
  if echo "$LOWER" | grep -qE "sales|marketing|pipeline|leadgen|revenue|client|invoice|crm|hiring|recruit|campaign|doanh thu|khách hàng"; then
    echo "/business-revenue-engine $TASK"
    return
  fi

  # 🎯 PRODUCT (Layer 4 — Plan/Sprint/Roadmap) — cascades to Eng→Ops
  if echo "$LOWER" | grep -qE "plan|sprint|roadmap|scope|brainstorm|persona|feature|product|backlog|spec|sản phẩm"; then
    echo "/plan \"$TASK\" --execute"
    return
  fi

  # ⚙️ ENGINEERING (Layer 5 — Cook/Code/Test/Deploy) — cascades to Ops
  if echo "$LOWER" | grep -qE "fix|bug|build|test|deploy|refactor|code|implement|lint|type.?check|api|schema|migrate|review"; then
    echo "/cook \"$TASK\""
    return
  fi

  # 🔧 OPS (Layer 6 — Audit/Health/Security)
  if echo "$LOWER" | grep -qE "audit|health|security|status|sync|clean|monitor|rollback"; then
    echo "/health"
    return
  fi

  # Default: Product layer (decompose first, then cascade down)
  echo "/plan \"$TASK\" --execute"
}

get_next_task() {
  local PROJECT=$1
  local QUEUE_FILE="$QUEUE_DIR/$PROJECT.queue"
  local DONE_FILE="$QUEUE_DIR/$PROJECT.done"

  [[ ! -f "$QUEUE_FILE" ]] && return 1
  touch "$DONE_FILE"

  while IFS= read -r TASK; do
    [[ -z "$TASK" ]] && continue
    TASK_HASH=$(echo "$TASK" | md5 -q 2>/dev/null || echo "$TASK" | md5sum | cut -d' ' -f1)
    if ! grep -q "$TASK_HASH" "$DONE_FILE" 2>/dev/null; then
      echo "$TASK_HASH" >> "$DONE_FILE"
      echo "$TASK"
      return 0
    fi
  done < "$QUEUE_FILE"

  echo "♻️ Queue exhausted for $PROJECT — resetting..." >&2
  > "$DONE_FILE"
  head -1 "$QUEUE_FILE"
  return 0
}

while true; do
  LOAD=$(sysctl -n vm.loadavg | awk '{print $2}')
  RAM=$(vm_stat | awk '/free/ {print $3}' | tr -d '.')
  echo "🧊 [$(date +%T)] Load=$LOAD RAM_free=$RAM — Checking panes..."

  # Cleanup
  pkill -f "node.*jest" 2>/dev/null || true
  pkill -f "node.*vitest" 2>/dev/null || true
  pkill -f "tsserver.js" 2>/dev/null || true

  for i in "${!PANES[@]}"; do
    PANE=${PANES[$i]}
    PROJECT=${PANE_PROJECTS[$i]}

    PANE_OUTPUT=$(tmux capture-pane -t "$TMUX_SESSION:0.$PANE" -p 2>/dev/null || echo "")
    LAST_LINES=$(echo "$PANE_OUTPUT" | tail -n 10)

    # Check CRASHED
    if echo "$LAST_LINES" | grep -qE "bash-5|% $"; then
      echo "☠️ [P$PANE] CRASHED — Restarting CC CLI..."
      tmux send-keys -t "$TMUX_SESSION:0.$PANE" -l "cd ~/mekong-cli && claude --dangerously-skip-permissions"
      sleep 0.5
      tmux send-keys -t "$TMUX_SESSION:0.$PANE" Enter
      continue
    fi

    # Check QUEUED
    if echo "$LAST_LINES" | grep -qE "Press up to edit queued"; then
      echo "📬 [P$PANE] QUEUED — Clearing..."
      tmux send-keys -t "$TMUX_SESSION:0.$PANE" Escape
      sleep 1
      continue
    fi

    # Check WORKING
    if echo "$LAST_LINES" | grep -qE "Bash\(|Read [0-9]|Write\(|Edit\(|Running|thinking|Hashing|Blanching|Creating|Hatching|Puttering|Generating|Tempering|Crunching|Bloviating|Actioning|Manifesting|Stewing|Billowing|Cogitated|Dilly-dallying|Infusing|Churned|Sautéed|Composting|Baked|Warping|Newspapering|Prestidigitating|Channeling|Metamorphosing|Propagating|Scampering|Brewing|Frosting|Moonwalking|Concocting|Sautéing|Orbiting|Compacting|Ebbing|Pondering|Crystallizing"; then
      echo "⚙️ [P$PANE] WORKING on $PROJECT — SKIP"
      continue
    fi

    # Check IDLE → CLASSIFY & DISPATCH via 6-layer pyramid
    if echo "$LAST_LINES" | grep -qE "❯|bypass permissions"; then
      TASK=$(get_next_task "$PROJECT")
      if [[ -n "$TASK" ]]; then
        CMD=$(classify_command "$TASK")
        LAYER="?"
        case "$CMD" in
          /studio*) LAYER="🏯 Studio" ;;
          /founder*) LAYER="👑 Founder" ;;
          /business*|/sales*|/marketing*) LAYER="💼 Business" ;;
          /plan*|/sprint*|/roadmap*) LAYER="🎯 Product" ;;
          /cook*|/code*|/fix*|/deploy*) LAYER="⚙️ Engineering" ;;
          /health*|/audit*|/security*) LAYER="🔧 Ops" ;;
          *) LAYER="🎯 Product" ;;
        esac
        echo "🎯 [P$PANE] IDLE → $LAYER → DISPATCHING for $PROJECT:"
        echo "   📌 ${CMD:0:120}..."
        tmux send-keys -t "$TMUX_SESSION:0.$PANE" -l "$CMD"
        sleep 0.5
        tmux send-keys -t "$TMUX_SESSION:0.$PANE" Enter
      else
        echo "📭 [P$PANE] No tasks in queue for $PROJECT"
      fi
      continue
    fi

    echo "❓ [P$PANE] UNKNOWN STATE for $PROJECT"
  done

  echo "💤 [$(date +%T)] Sleeping ${SLEEP_INTERVAL}s..."
  sleep $SLEEP_INTERVAL
done
