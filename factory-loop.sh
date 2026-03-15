#!/bin/bash
# FACTORY LOOP v10.0 — CTO THƯỢNG TẦNG: VC-LEVEL DISPATCH
# CTO dispatches REAL VC/Studio/Founder/Business commands from mekong CLI.
# Commands defined in .claude/commands/ — CC CLI executes via DAG recipes.
# 5 Business Layers: Founder → Business → Product → Engineering → Ops
# CTO NEVER dispatches /cook. That's layer 4/5. CTO dispatches layer 1-3.
# Date: 2026-03-15 | agencyos.network architecture
set -euo pipefail

TMUX_SESSION="tom_hum"
PANES=(0 1)
PANE_PROJECTS=("sophia-proposal" "well")
PANE_DIRS=("apps/sophia-proposal" "apps/well")
PANE_NAMES=("Sophia AI Video Factory" "WellNexus Healthcare B2B")
SLEEP_INTERVAL=120

echo "🏭 FACTORY v10.0 — VC-LEVEL CTO — $(date) — PID: $$"
echo "👑 CTO dispatches Founder/Studio/Business commands — NEVER /cook"
echo "🏛️ P0=${PANE_PROJECTS[0]}, P1=${PANE_PROJECTS[1]}"

# ═══════════════════════════════════════════════════════════════
# THƯỢNG TẦNG COMMAND ROTATION — VC/Studio/Founder/Business
# These are REAL .claude/commands/*.md files. CC CLI knows them.
# Each cascades: Founder→Business→Product→Engineering→Ops
# ═══════════════════════════════════════════════════════════════

# 🏯 Studio commands — highest level, portfolio-wide
STUDIO_CMDS=(
  "/studio-operate-daily"
  "/studio-sprint-weekly"
  "/portfolio-status"
  "/portfolio-report"
)

# 👑 Founder commands — strategy & fundraise
FOUNDER_CMDS=(
  "/founder-validate"
  "/venture-thesis"
  "/venture-terrain"
  "/venture-momentum"
  "/venture-five-factors"
)

# 💼 Business commands — revenue & growth
BUSINESS_CMDS=(
  "/business-revenue-engine"
  "/sales-pipeline-build"
  "/marketing-content-engine"
)

# 🎯 Product commands — plan & roadmap (falls through to engineering)
PRODUCT_CMDS=(
  "/plan"
  "/design-sprint"
)

# Combine all into rotation — top layers first
ALL_CMDS=("${STUDIO_CMDS[@]}" "${FOUNDER_CMDS[@]}" "${BUSINESS_CMDS[@]}" "${PRODUCT_CMDS[@]}")

get_next_command() {
  local PANE=$1
  local PROJECT=$2
  local DIR=$3
  local NAME=$4

  # Track rotation per pane
  local IDX_FILE="/tmp/cto_cmd_idx_P${PANE}"
  local IDX=$(cat "$IDX_FILE" 2>/dev/null || echo "0")
  local TOTAL=${#ALL_CMDS[@]}

  # Get command from rotation
  local CMD="${ALL_CMDS[$((IDX % TOTAL))]}"

  # Advance rotation
  echo $(( (IDX + 1) % TOTAL )) > "$IDX_FILE"

  # Append project context as argument
  echo "${CMD} ${NAME} — Thư mục: ${DIR}"
}

while true; do
  LOAD=$(sysctl -n vm.loadavg | awk '{print $2}')
  RAM=$(vm_stat | awk '/free/ {print $3}' | tr -d '.')
  echo "🧊 [$(date +%T)] Load=$LOAD RAM_free=$RAM"

  pkill -f "node.*jest" 2>/dev/null || true
  pkill -f "node.*vitest" 2>/dev/null || true
  pkill -f "tsserver.js" 2>/dev/null || true

  for i in "${!PANES[@]}"; do
    PANE=${PANES[$i]}
    PROJECT=${PANE_PROJECTS[$i]}
    DIR=${PANE_DIRS[$i]}
    NAME=${PANE_NAMES[$i]}

    PANE_OUTPUT=$(tmux capture-pane -t "$TMUX_SESSION:0.$PANE" -p 2>/dev/null || echo "")
    LAST_45=$(echo "$PANE_OUTPUT" | tail -n 45)
    LAST_5=$(echo "$PANE_OUTPUT" | tail -n 5)

    # CRASHED
    if echo "$LAST_5" | grep -qE "bash-5|% $"; then
      echo "☠️ [P$PANE] CRASHED — Restarting CC CLI..."
      tmux send-keys -t "$TMUX_SESSION:0.$PANE" -l "cd ~/mekong-cli && claude --dangerously-skip-permissions"
      sleep 0.5
      tmux send-keys -t "$TMUX_SESSION:0.$PANE" Enter
      continue
    fi

    # QUEUED
    if echo "$LAST_5" | grep -qE "Press up to edit queued"; then
      echo "📬 [P$PANE] QUEUED — Clearing..."
      tmux send-keys -t "$TMUX_SESSION:0.$PANE" Escape
      sleep 1
      continue
    fi

    # WORKING — check LAST 5 lines ONLY (active animation near prompt)
    # Old output in scroll buffer must NOT trigger this
    if echo "$LAST_5" | grep -qE "Bash\(|Read [0-9]|Write\(|Edit\(|Running|thinking|Hashing|Blanching|Creating|Hatching|Puttering|Generating|Tempering|Crunching|Bloviating|Actioning|Manifesting|Stewing|Billowing|Cogitated|Dilly-dallying|Infusing|Churned|Sautéed|Composting|Baked|Warping|Newspapering|Prestidigitating|Channeling|Metamorphosing|Propagating|Scampering|Brewing|Frosting|Moonwalking|Concocting|Sautéing|Orbiting|Compacting|Ebbing|Pondering|Crystallizing|Precipitating|Mulling|Searching for|thought for|Harmonizing"; then
      echo "⚙️ [P$PANE] WORKING on $PROJECT — SKIP"
      continue
    fi

    # JUST FINISHED
    if echo "$LAST_45" | grep -qE "✅ Done|completed|✔|git commit|git push|All tests pass|Build succeeded"; then
      echo "🏁 [P$PANE] JUST FINISHED — cooldown"
      continue
    fi

    # TRULY IDLE → dispatch VC-level command
    if echo "$LAST_5" | grep -qE "❯|bypass permissions"; then
      COOLDOWN_FILE="/tmp/cto_cooldown_P${PANE}"
      NOW=$(date +%s)
      LAST_DISPATCH=$(cat "$COOLDOWN_FILE" 2>/dev/null || echo "0")
      ELAPSED=$((NOW - LAST_DISPATCH))

      if [ "$ELAPSED" -lt 180 ]; then
        echo "⏳ [P$PANE] COOLDOWN (${ELAPSED}s < 180s) — skip"
        continue
      fi

      CMD=$(get_next_command "$PANE" "$PROJECT" "$DIR" "$NAME")
      LAYER="?"
      case "$CMD" in
        /studio*|/portfolio*) LAYER="🏯 Studio" ;;
        /founder*|/venture*) LAYER="👑 Founder" ;;
        /business*|/sales*|/marketing*) LAYER="💼 Business" ;;
        /plan*|/design*) LAYER="🎯 Product" ;;
        *) LAYER="👑 Founder" ;;
      esac

      echo "$LAYER [P$PANE] DISPATCHING for $PROJECT:"
      echo "   📌 $CMD"

      tmux send-keys -t "$TMUX_SESSION:0.$PANE" -l "$CMD"
      sleep 0.5
      tmux send-keys -t "$TMUX_SESSION:0.$PANE" Enter
      echo "$NOW" > "$COOLDOWN_FILE"
      continue
    fi

    echo "❓ [P$PANE] UNKNOWN STATE"
  done

  echo "💤 [$(date +%T)] Sleeping ${SLEEP_INTERVAL}s..."
  sleep $SLEEP_INTERVAL
done
