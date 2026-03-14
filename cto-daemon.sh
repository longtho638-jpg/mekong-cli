#!/usr/bin/env bash
set -uo pipefail

# ============================================================
# CTO DAEMON v2.0 — Full P→D→V→S Loop Implementation
# Source: apps/openclaw-worker/openclaw-cto-agent.md
#
# USAGE: ./cto-daemon.sh [--session NAME] [--interval SECS]
#
# Any dev cloning the repo can configure via:
#   .mekong/cto-config.json  (auto-created on first run)
# ============================================================

# ---- CONFIG (portable — auto-detect project root) ----
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$SCRIPT_DIR}"
MEKONG_DIR="${PROJECT_ROOT}/.mekong"
CONFIG_FILE="${MEKONG_DIR}/cto-config.json"
LOG_FILE="${MEKONG_DIR}/cto-daemon.log"
MEMORY_FILE="${MEKONG_DIR}/cto-memory.md"
JIDOKA_FILE="${MEKONG_DIR}/jidoka-alerts.log"

# Defaults (overridable via CLI flags)
CTO_SESSION="${CTO_SESSION:-tom_hum}"
POLL_INTERVAL="${POLL_INTERVAL:-30}"
MAX_LOG_LINES=1000

# Parse CLI flags
while [[ $# -gt 0 ]]; do
  case $1 in
    --session) CTO_SESSION="$2"; shift 2 ;;
    --interval) POLL_INTERVAL="$2"; shift 2 ;;
    --project) PROJECT_ROOT="$2"; shift 2 ;;
    --help) echo "Usage: $0 [--session tmux_session] [--interval poll_secs] [--project /path]"; exit 0 ;;
    *) shift ;;
  esac
done

# ---- INIT ----
mkdir -p "$MEKONG_DIR"

# Auto-create config if not exists
if [[ ! -f "$CONFIG_FILE" ]]; then
  cat > "$CONFIG_FILE" << 'CONF'
{
  "workers": {
    "1": { "name": "Worker-1", "dir": ".", "stack": "auto", "deploy_cmd": "npm run build" },
    "2": { "name": "Worker-2", "dir": ".", "stack": "auto", "deploy_cmd": "npm run build" },
    "3": { "name": "Worker-3", "dir": ".", "stack": "auto", "deploy_cmd": "npm run build" }
  },
  "auto_approve": true,
  "jidoka_enabled": true,
  "delegation_template": true,
  "max_retries": 3
}
CONF
  echo "[CTO] Created default config at $CONFIG_FILE — edit to match your project."
fi

# ---- LOGGING ----
log() {
  local msg="[$(date '+%H:%M:%S')] $*"
  echo "$msg" | tee -a "$LOG_FILE"
  # Rotate log if too large
  if [[ $(wc -l < "$LOG_FILE" 2>/dev/null || echo 0) -gt $MAX_LOG_LINES ]]; then
    tail -500 "$LOG_FILE" > "${LOG_FILE}.tmp" && mv "${LOG_FILE}.tmp" "$LOG_FILE"
  fi
}

# ---- WORKER CONFIG (read from cto-config.json or fallback) ----
get_worker_config() {
  local idx=$1 field=$2
  if command -v python3 &>/dev/null && [[ -f "$CONFIG_FILE" ]]; then
    python3 -c "import json; c=json.load(open('$CONFIG_FILE')); print(c.get('workers',{}).get('$idx',{}).get('$field',''))" 2>/dev/null
  fi
}

# Load worker names and dirs
declare -A WORKER_NAME WORKER_DIR WORKER_DEPLOY WORKER_RETRIES
for idx in 1 2 3; do
  WORKER_NAME[$idx]=$(get_worker_config "$idx" "name")
  WORKER_DIR[$idx]=$(get_worker_config "$idx" "dir")
  WORKER_DEPLOY[$idx]=$(get_worker_config "$idx" "deploy_cmd")
  WORKER_RETRIES[$idx]=0
  [[ -z "${WORKER_NAME[$idx]}" ]] && WORKER_NAME[$idx]="Worker-$idx"
  [[ -z "${WORKER_DIR[$idx]}" ]] && WORKER_DIR[$idx]="."
  [[ -z "${WORKER_DEPLOY[$idx]}" ]] && WORKER_DEPLOY[$idx]="npm run build"
done

# ---- TMUX HELPERS ----
capture_pane() {
  tmux capture-pane -t "${CTO_SESSION}:0.${1}" -p -S -20 2>/dev/null || echo ""
}

send_to_pane() {
  local pane_idx=$1; shift
  tmux send-keys -t "${CTO_SESSION}:0.${pane_idx}" "$*" Enter
}

# ---- PHASE 1: SCAN ----
# Reads codebase context on startup (per spec: CLAUDE.md, package.json, src/, git log)
phase_scan() {
  log "PHASE 1: SCAN — Reading codebase context"
  local scan_summary=""

  # 1. CLAUDE.md / AGENTS.md
  if [[ -f "${PROJECT_ROOT}/CLAUDE.md" ]]; then
    scan_summary+="Conventions: CLAUDE.md exists. "
  fi

  # 2. Stack detection
  if [[ -f "${PROJECT_ROOT}/package.json" ]]; then
    local stack
    stack=$(python3 -c "import json; p=json.load(open('${PROJECT_ROOT}/package.json')); deps=list(p.get('dependencies',{}).keys()); print(','.join(deps[:5]))" 2>/dev/null || echo "node")
    scan_summary+="Stack: Node ($stack). "
  elif [[ -f "${PROJECT_ROOT}/pyproject.toml" ]]; then
    scan_summary+="Stack: Python. "
  fi

  # 3. src/ structure
  local src_count
  src_count=$(find "${PROJECT_ROOT}/src" -name "*.py" -o -name "*.ts" -o -name "*.js" 2>/dev/null | wc -l | tr -d ' ')
  scan_summary+="Source files: ${src_count}. "

  # 4. Git log
  local last_commit
  last_commit=$(cd "$PROJECT_ROOT" && git log --oneline -1 2>/dev/null || echo "no git")
  scan_summary+="Last commit: ${last_commit}. "

  # 5. Apps directory
  local apps=""
  for app_dir in "${PROJECT_ROOT}"/apps/*/; do
    [[ -d "$app_dir" ]] && apps+="$(basename "$app_dir") "
  done
  scan_summary+="Apps: ${apps:-none}. "

  log "SCAN RESULT: $scan_summary"
  save_memory "SCAN" "$scan_summary"
}

# ---- DETECTION FUNCTIONS ----

is_idle() {
  local output="$1"
  echo "$output" | tail -5 | grep -qE "^❯|⏵⏵ bypass" && \
  ! echo "$output" | tail -5 | grep -qE "Running|thinking|Cooking|Baking|Stewing|Sautéed|Elucidating|Imagining|Crunching|Writing|Reading"
}

has_question() {
  local output="$1"
  echo "$output" | tail -10 | grep -vE "🔋|⏰|📁|🌿|bypass|auto-compact|compact|model" | grep -q "?"
}

get_question() {
  local output="$1"
  echo "$output" | tail -10 | grep -vE "🔋|⏰|📁|🌿|bypass|auto-compact|compact|model" | grep "?" | tail -1
}

has_error() {
  local output="$1"
  echo "$output" | tail -15 | grep -qiE "error|failed|FAILED|Error:|SyntaxError|TypeError|ImportError|ModuleNotFoundError"
}

get_error() {
  local output="$1"
  echo "$output" | tail -15 | grep -iE "error|failed|FAILED|Error:|SyntaxError" | tail -1
}

# Jidoka: detect stop-the-line conditions (per spec)
check_jidoka() {
  local output="$1" pane_idx="$2"
  # Detect: breaking tests, schema changes, security issues
  if echo "$output" | grep -qiE "BREAKING|security vulnerability|database migration|schema change"; then
    local alert="🚨 STOP-THE-LINE P${pane_idx}: $(echo "$output" | grep -iE 'BREAKING|security|migration|schema' | tail -1)"
    log "$alert"
    echo "$alert" >> "$JIDOKA_FILE"
    _telegram_alert "$alert"
    return 0  # jidoka triggered
  fi
  return 1  # no jidoka
}

# Telegram alert notification (called on Jidoka triggers)
_telegram_alert() {
  local msg="$1"
  local token="${MEKONG_TELEGRAM_TOKEN:-}"
  local chat_id="${MEKONG_TELEGRAM_CHAT_ID:-}"
  if [[ -n "$token" && -n "$chat_id" ]]; then
    curl -s "https://api.telegram.org/bot${token}/sendMessage" \
      -d "chat_id=${chat_id}" \
      -d "text=🚨 Jidoka Alert: ${msg}" \
      -d "parse_mode=Markdown" > /dev/null 2>&1 &
  fi
}

# ---- PHASE 2: PLAN — Build delegation task ----
# Per spec: specific title, definition of done, constraints
build_delegation_task() {
  local pane_idx=$1
  local name="${WORKER_NAME[$pane_idx]}"
  local dir="${WORKER_DIR[$pane_idx]}"
  local deploy="${WORKER_DEPLOY[$pane_idx]}"
  local retries="${WORKER_RETRIES[$pane_idx]}"

  local task_prefix=""
  if [[ "$retries" -gt 0 ]]; then
    task_prefix="RETRY #${retries}: Previous attempt had errors. "
  fi

  # Per spec: CONTEXT + TASK + DEFINITION OF DONE + CONSTRAINTS
  cat << EOF
/cook "${task_prefix}[CONTEXT] Project: ${name}, Dir: ${dir}, Stack: auto-detect.
[TASK] Deploy ${name}: cd ${dir} && ${deploy} 2>&1 | tail -20. Fix ALL errors found.
[DEFINITION OF DONE] (1) Build passes with zero errors (2) All tests pass (3) No linting errors (4) Code committed and pushed.
[CONSTRAINTS] (1) Do NOT touch files outside ${dir} (2) Follow existing patterns (3) File size < 200 lines (4) NO QUESTIONS — auto-approve all." --auto
EOF
}

# ---- PHASE 3: DELEGATE ----
dispatch_worker() {
  local pane_idx=$1
  local name="${WORKER_NAME[$pane_idx]}"

  local task
  task=$(build_delegation_task "$pane_idx")
  send_to_pane "$pane_idx" "$task"
  log "DELEGATED P${pane_idx} (${name}) — task with CONTEXT+DOD+CONSTRAINTS"
}

# ---- PHASE 4: VERIFY ----
verify_worker() {
  local pane_idx=$1 output="$2"
  local name="${WORKER_NAME[$pane_idx]}"

  # Check for questions → auto-answer
  if has_question "$output"; then
    local question
    question=$(get_question "$output")
    log "VERIFY P${pane_idx}: QUESTION: $question → AUTO-ANSWERING"
    send_to_pane "$pane_idx" "Yes, proceed. Auto-approve all. Deploy now."
    save_memory "VERIFY" "Auto-answered P${pane_idx}: ${question}"
    return 0
  fi

  # Check for errors → re-delegate with error context (spec: re-delegation template)
  if has_error "$output" && is_idle "$output"; then
    local error_msg
    error_msg=$(get_error "$output")
    WORKER_RETRIES[$pane_idx]=$((${WORKER_RETRIES[$pane_idx]} + 1))

    if [[ ${WORKER_RETRIES[$pane_idx]} -le 3 ]]; then
      log "VERIFY P${pane_idx}: ERROR DETECTED — re-delegating (retry ${WORKER_RETRIES[$pane_idx]})"
      log "  Error: $error_msg"
      dispatch_worker "$pane_idx"
      save_memory "RE-DELEGATE" "P${pane_idx} retry ${WORKER_RETRIES[$pane_idx]}: ${error_msg}"
    else
      log "VERIFY P${pane_idx}: MAX RETRIES REACHED — escalating"
      save_memory "ESCALATE" "P${pane_idx} failed after 3 retries: ${error_msg}"
    fi
    return 0
  fi

  # Jidoka check
  if check_jidoka "$output" "$pane_idx"; then
    log "VERIFY P${pane_idx}: JIDOKA TRIGGERED — halting worker"
    return 0
  fi

  return 1  # no action needed
}

# ---- PHASE 5: INTEGRATE ----
phase_integrate() {
  cd "$PROJECT_ROOT" || return

  # Check for merge conflicts
  if git diff --name-only --diff-filter=U 2>/dev/null | grep -q .; then
    log "INTEGRATE: MERGE CONFLICTS DETECTED"
    save_memory "INTEGRATE" "Merge conflicts found"
    return
  fi

  # Push any unpushed commits
  local unpushed
  unpushed=$(git log origin/master..HEAD --oneline 2>/dev/null | wc -l | tr -d ' ')
  if [[ "$unpushed" -gt "0" ]]; then
    log "INTEGRATE: Pushing $unpushed commits..."
    if git push origin master 2>&1 | tail -3 >> "$LOG_FILE"; then
      log "INTEGRATE: Push SUCCESS"
      save_memory "SHIP" "Pushed $unpushed commits to master"
    else
      log "INTEGRATE: Push FAILED"
    fi
  fi
}

# ---- MEMORY PERSISTENCE (spec Rule 5) ----
save_memory() {
  local phase="$1" detail="$2"
  {
    echo "## $(date '+%Y-%m-%d %H:%M:%S') — ${phase}"
    echo "- ${detail}"
    echo ""
  } >> "$MEMORY_FILE"
}

# ---- M1 HEALTH CHECK ----
health_check() {
  local load ram ssd
  load=$(sysctl -n vm.loadavg 2>/dev/null || echo "N/A")
  ram=$(vm_stat 2>/dev/null | awk '/free/ {print $3}' | head -1 || echo "N/A")
  ssd=$(df -h / 2>/dev/null | awk 'NR==2{print $4}' || echo "N/A")
  log "HEALTH: Load=${load} RAM_free=${ram} SSD_free=${ssd}"
}

# ============================================================
# MAIN LOOP — P→D→V→S forever
# ============================================================
log "============================================="
log "CTO DAEMON v2.0 — P→D→V→S Full Implementation"
log "Session: ${CTO_SESSION} | Poll: ${POLL_INTERVAL}s"
log "Project: ${PROJECT_ROOT}"
log "Workers: P1=${WORKER_NAME[1]} P2=${WORKER_NAME[2]} P3=${WORKER_NAME[3]}"
log "Config: ${CONFIG_FILE}"
log "============================================="

# PHASE 1: Initial SCAN on startup
phase_scan

CYCLE=0
LAST_DISPATCH_1=0
LAST_DISPATCH_2=0
LAST_DISPATCH_3=0
DISPATCH_COOLDOWN=90
while true; do
  CYCLE=$((CYCLE + 1))
  NOW=$(date +%s)
  log "--- CYCLE $CYCLE ---"

  # PHASE 3+4: For each worker, DELEGATE if idle or VERIFY if active
  for pane_idx in 1 2 3; do
    output=$(capture_pane "$pane_idx")
    name="${WORKER_NAME[$pane_idx]}"

    if [[ -z "$output" ]]; then
      log "P${pane_idx} (${name}): NO OUTPUT (pane dead?)"
      continue
    fi

    # PHASE 4: VERIFY — check questions, errors, jidoka
    if verify_worker "$pane_idx" "$output"; then
      continue  # verify handled the worker
    fi

    # If idle and not recently dispatched → DELEGATE new task (with cooldown)
    if is_idle "$output"; then
      eval last_dispatch=\$LAST_DISPATCH_${pane_idx}
      elapsed=$((NOW - last_dispatch))
      if [[ $elapsed -ge $DISPATCH_COOLDOWN ]]; then
        log "P${pane_idx} (${name}): IDLE → DELEGATING"
        WORKER_RETRIES[$pane_idx]=0
        dispatch_worker "$pane_idx"
        eval LAST_DISPATCH_${pane_idx}=$NOW
      else
        log "P${pane_idx} (${name}): IDLE (cooldown ${elapsed}/${DISPATCH_COOLDOWN}s)"
      fi
    else
      # Worker is active — extract status
      status_word=$(echo "$output" | grep -oE "Running|thinking|Cooking|Baking|Stewing|Sautéed|Elucidating|Imagining|Crunching|Writing|Reading|Commit" | tail -1)
      log "P${pane_idx} (${name}): WORKING (${status_word:-active})"
    fi
  done

  # PHASE 5: INTEGRATE — push, check conflicts
  phase_integrate

  # Health check every 5 cycles
  if [[ $((CYCLE % 5)) -eq 0 ]]; then
    health_check
  fi

  # Re-scan every 20 cycles to update context
  if [[ $((CYCLE % 20)) -eq 0 ]]; then
    phase_scan
  fi

  sleep "$POLL_INTERVAL"
done
