#!/bin/bash
# FACTORY LOOP v9.0 — SMART CTO: Reads repo, crafts actionable prompts
# CTO reads git status + recent commits BEFORE dispatching.
# Generates SPECIFIC, ACTIONABLE prompts — not generic slash commands.
# Follows 6-layer pyramid: Studio→Founder→Business→Product→Engineering→Ops
# Date: 2026-03-15
set -euo pipefail

TMUX_SESSION="tom_hum"
PANES=(0 1)
PANE_PROJECTS=("sophia-proposal" "well")
PANE_DIRS=("apps/sophia-proposal" "apps/well")
PANE_REPOS=("sophia-ai-factory.git" "Well.git")
PANE_STACKS=("Next.js + FastAPI" "Next.js + Supabase")
PANE_NAMES=("Sophia AI Video Factory" "WellNexus Healthcare B2B")
MEKONG_ROOT="$HOME/mekong-cli"
SLEEP_INTERVAL=120

echo "🏭 FACTORY LOOP v9.0 — SMART CTO — $(date) — PID: $$"
echo "🧠 CTO reads git state → crafts actionable prompts → dispatches"
echo "🏛️ P0=${PANE_PROJECTS[0]}, P1=${PANE_PROJECTS[1]}"

# ═══════════════════════════════════════════════════════════════
# SMART PROMPT GENERATOR — CTO reads repo state, builds prompt
# ═══════════════════════════════════════════════════════════════
generate_smart_prompt() {
  local PROJECT="$1"
  local DIR="$2"
  local REPO="$3"
  local STACK="$4"
  local NAME="$5"
  local PROJECT_PATH="$MEKONG_ROOT/$DIR"

  # CTO reads project state
  local GIT_STATUS=""
  local RECENT_COMMITS=""
  local BUILD_OK="unknown"
  local HAS_ERRORS=""

  if [ -d "$PROJECT_PATH" ]; then
    GIT_STATUS=$(cd "$PROJECT_PATH" && git status --short 2>/dev/null | head -5)
    RECENT_COMMITS=$(cd "$PROJECT_PATH" && git log --oneline -3 2>/dev/null)
    
    # Quick build check
    if [ -f "$PROJECT_PATH/package.json" ]; then
      HAS_ERRORS=$(cd "$PROJECT_PATH" && npx tsc --noEmit 2>&1 | grep -c "error" 2>/dev/null || echo "0")
    fi
  fi

  # Read Hiến Pháp for ROIaaS phase tracking
  local HIEN_PHAP_PHASE="GATE"
  if [ -f "$MEKONG_ROOT/HIEN-PHAP-ROIAAS.md" ]; then
    # Check which phase the project is at based on existing files
    if [ -f "$PROJECT_PATH/lib/raas-gate.ts" ] || [ -f "$PROJECT_PATH/src/lib/raas-gate.ts" ]; then
      HIEN_PHAP_PHASE="LICENSE_UI"
    fi
    if ls "$PROJECT_PATH"/src/*license* 2>/dev/null | grep -q .; then
      HIEN_PHAP_PHASE="WEBHOOK"
    fi
  fi

  # Build the smart prompt based on project state
  cat <<PROMPT
Đọc kỹ trước khi làm:
1. Đọc file CLAUDE.md (ở root ~/mekong-cli) để hiểu kiến trúc 6 tầng
2. Đọc file HIEN-PHAP-ROIAAS.md để hiểu 5-Phase DNA: GATE→LICENSE_UI→WEBHOOK→METERING→ANALYTICS
3. cd $DIR && git log --oneline -5 để hiểu dự án đang ở đâu

Dự án: $NAME
Thư mục: $DIR
Repo: $REPO
Stack: $STACK
Phase ROIaaS hiện tại: $HIEN_PHAP_PHASE

Git status: ${GIT_STATUS:-clean}
Commits gần nhất: ${RECENT_COMMITS:-none}
TypeScript errors: ${HAS_ERRORS:-unknown}

NHIỆM VỤ (theo thứ tự ưu tiên):
1. cd $DIR && npm run build 2>&1 | tail -20 — nếu FAIL → fix build errors trước
2. cd $DIR && npm run lint 2>&1 | tail -20 — fix lint errors
3. cd $DIR && npm test 2>&1 | tail -20 — fix test failures
4. Nếu ALL GREEN → tiến hành Phase $HIEN_PHAP_PHASE theo HIEN-PHAP-ROIAAS.md
5. git add -A && git commit -m "feat($PROJECT): [mô tả ngắn]"
6. cd $DIR && git push origin main hoặc master

CẤM: Không /cook lại. Không tạo file placeholder. Không skip test. Làm xong báo cáo kết quả.
PROMPT
}

while true; do
  LOAD=$(sysctl -n vm.loadavg | awk '{print $2}')
  RAM=$(vm_stat | awk '/free/ {print $3}' | tr -d '.')
  echo "🧊 [$(date +%T)] Load=$LOAD RAM_free=$RAM"

  # Cleanup
  pkill -f "node.*jest" 2>/dev/null || true
  pkill -f "node.*vitest" 2>/dev/null || true
  pkill -f "tsserver.js" 2>/dev/null || true

  for i in "${!PANES[@]}"; do
    PANE=${PANES[$i]}
    PROJECT=${PANE_PROJECTS[$i]}
    DIR=${PANE_DIRS[$i]}
    REPO=${PANE_REPOS[$i]}
    STACK=${PANE_STACKS[$i]}
    NAME=${PANE_NAMES[$i]}

    PANE_OUTPUT=$(tmux capture-pane -t "$TMUX_SESSION:0.$PANE" -p 2>/dev/null || echo "")
    LAST_LINES=$(echo "$PANE_OUTPUT" | tail -n 10)

    # CRASHED
    if echo "$LAST_LINES" | grep -qE "bash-5|% $"; then
      echo "☠️ [P$PANE] CRASHED — Restarting CC CLI..."
      tmux send-keys -t "$TMUX_SESSION:0.$PANE" -l "cd ~/mekong-cli && claude --dangerously-skip-permissions"
      sleep 0.5
      tmux send-keys -t "$TMUX_SESSION:0.$PANE" Enter
      continue
    fi

    # QUEUED
    if echo "$LAST_LINES" | grep -qE "Press up to edit queued"; then
      echo "📬 [P$PANE] QUEUED — Clearing..."
      tmux send-keys -t "$TMUX_SESSION:0.$PANE" Escape
      sleep 1
      continue
    fi

    # WORKING
    if echo "$LAST_LINES" | grep -qE "Bash\(|Read [0-9]|Write\(|Edit\(|Running|thinking|Hashing|Blanching|Creating|Hatching|Puttering|Generating|Tempering|Crunching|Bloviating|Actioning|Manifesting|Stewing|Billowing|Cogitated|Dilly-dallying|Infusing|Churned|Sautéed|Composting|Baked|Warping|Newspapering|Prestidigitating|Channeling|Metamorphosing|Propagating|Scampering|Brewing|Frosting|Moonwalking|Concocting|Sautéing|Orbiting|Compacting|Ebbing|Pondering|Crystallizing|Precipitating|Mulling"; then
      echo "⚙️ [P$PANE] WORKING on $PROJECT — SKIP"
      continue
    fi

    # IDLE → CTO generates smart prompt and dispatches
    if echo "$LAST_LINES" | grep -qE "❯|bypass permissions"; then
      echo "🧠 [P$PANE] IDLE → Generating smart prompt for $PROJECT..."

      SMART_PROMPT=$(generate_smart_prompt "$PROJECT" "$DIR" "$REPO" "$STACK" "$NAME")

      # Write prompt to temp file
      PROMPT_FILE="/tmp/cto_mission_P${PANE}.txt"
      echo "$SMART_PROMPT" > "$PROMPT_FILE"

      echo "🏯 [P$PANE] DISPATCHING $NAME:"
      echo "   📌 Phase: $(grep 'Phase ROIaaS' "$PROMPT_FILE" | head -1)"

      # Inject prompt into CC CLI via tmux load-buffer → paste-buffer
      tmux load-buffer "$PROMPT_FILE"
      tmux paste-buffer -t "$TMUX_SESSION:0.$PANE"
      sleep 0.5
      tmux send-keys -t "$TMUX_SESSION:0.$PANE" Enter
      continue
    fi

    echo "❓ [P$PANE] UNKNOWN STATE"
  done

  echo "💤 [$(date +%T)] Sleeping ${SLEEP_INTERVAL}s..."
  sleep $SLEEP_INTERVAL
done
