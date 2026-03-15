#!/bin/bash
# FACTORY LOOP v8.0 — CTO THƯỢNG TẦNG: ALWAYS STUDIO-LEVEL DISPATCH
# CTO dispatches ONLY from Studio layer (thượng tầng).
# The cascade engine inside CC CLI breaks commands down through:
#   🏯 Studio → 👑 Founder → 💼 Business → 🎯 Product → ⚙️ Engineering → 🔧 Ops
# CTO NEVER dispatches /cook directly. That's the cascade engine's job.
# Date: 2026-03-15 | Aligned with CLAUDE.md v6.0 + factory/layers.yaml
set -euo pipefail

TMUX_SESSION="tom_hum"
PANES=(0 1)
PANE_PROJECTS=("sophia-proposal" "well")
SLEEP_INTERVAL=120

# ═══════════════════════════════════════════════════════════════
# STUDIO-LEVEL COMMANDS — CTO dispatches ONLY these
# CC CLI file: .claude/commands/studio-operate-daily.md (HYPHENS)
# These cascade through ALL 6 layers automatically
# ═══════════════════════════════════════════════════════════════
STUDIO_DAILY="/studio-operate-daily"
STUDIO_WEEKLY="/studio-sprint-weekly"
STUDIO_LAUNCH="/studio-launch-full"
STUDIO_DILIGENCE="/studio-diligence-deep"

echo "🏭 FACTORY LOOP v8.0 — STUDIO-ONLY DISPATCH — $(date) — PID: $$"
echo "🏯 CTO dispatches from Studio layer ONLY. Cascade engine handles downstream."
echo "🏛️ PANES: P0=${PANE_PROJECTS[0]}, P1=${PANE_PROJECTS[1]}"

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
    if echo "$LAST_LINES" | grep -qE "Bash\(|Read [0-9]|Write\(|Edit\(|Running|thinking|Hashing|Blanching|Creating|Hatching|Puttering|Generating|Tempering|Crunching|Bloviating|Actioning|Manifesting|Stewing|Billowing|Cogitated|Dilly-dallying|Infusing|Churned|Sautéed|Composting|Baked|Warping|Newspapering|Prestidigitating|Channeling|Metamorphosing|Propagating|Scampering|Brewing|Frosting|Moonwalking|Concocting|Sautéing|Orbiting|Compacting|Ebbing|Pondering|Crystallizing|Precipitating|Mulling"; then
      echo "⚙️ [P$PANE] WORKING on $PROJECT — SKIP"
      continue
    fi

    # Check IDLE → ALWAYS dispatch Studio-level command
    if echo "$LAST_LINES" | grep -qE "❯|bypass permissions"; then
      CMD="$STUDIO_DAILY $PROJECT"
      echo "🏯 [P$PANE] IDLE → STUDIO DISPATCH for $PROJECT:"
      echo "   📌 $CMD"
      tmux send-keys -t "$TMUX_SESSION:0.$PANE" -l "$CMD"
      sleep 0.5
      tmux send-keys -t "$TMUX_SESSION:0.$PANE" Enter
      continue
    fi

    echo "❓ [P$PANE] UNKNOWN STATE for $PROJECT"
  done

  echo "💤 [$(date +%T)] Sleeping ${SLEEP_INTERVAL}s..."
  sleep $SLEEP_INTERVAL
done
