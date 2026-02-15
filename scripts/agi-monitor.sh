#!/bin/bash
# AGI Infinite Monitor v3 — 用間 (Yong Jian): Intelligence Network
# P0 Oversight: Proxy + Workers + Vercel + GitHub + Supabase + Gate
# Runs forever: 60s cycles, auto-recovery

CYCLE=0
PROXY_LOG="/Users/macbookprom1/proxy_v7.log"
MEKONG="/Users/macbookprom1/mekong-cli"
SESSION="tom_hum_brain"

# Supabase project refs
SB_PROJECTS="jcbahdioqoepvoliplqy vgtsoolwudtlpijcvrmc"
SB_NAMES="AgencyOS sa-dec-flower"

while true; do
  CYCLE=$((CYCLE + 1))
  TS=$(date +%H:%M:%S)

  # === PROXY HEALTH ===
  H=$(curl -s http://localhost:11436/health 2>/dev/null)
  if [ -z "$H" ]; then
    echo "[$TS] C$CYCLE ❌ PROXY DOWN — restarting..."
    pkill -f "anthropic-adapter" 2>/dev/null
    sleep 2
    nohup node "$MEKONG/scripts/anthropic-adapter.js" > "$PROXY_LOG" 2>&1 &
    sleep 3
    continue
  fi

  STATS=$(echo "$H" | python3 -c "
import sys,json
try:
  d=json.load(sys.stdin)
  b_o=sum(1 for k in d['ollama'] if k['blocked'])
  ag=d.get('antigravity',{})
  b_g=sum(1 for k in d['google'] if k['blocked'])
  print(f'R:{d[\"requests\"]} O:{b_o}/8 AG:{ag.get(\"total\",0)} G:{b_g}/6 Q:{d[\"queue\"]}')
except: print('PARSE_ERR')
" 2>/dev/null)

  # === WORKER STATUS (虛實: Ultimate Resilience v5) ===
  W=""
  DEAD_WORKERS=""
  for p in 1 2 3; do
    # Capture buffer
    BUFFER=$(tmux capture-pane -t ${SESSION}:0.$p -p -S -10 2>/dev/null)
    # Get last non-empty line
    LAST_LINE=$(echo "$BUFFER" | sed '/^$/d' | tail -1)
    
    # 🔖 Trạng thái máy
    ST=$(echo "$BUFFER" | grep -oE '(Sautéing|Cooking|Roosting|Herding|Forging|Simmering|Deciphering|Embellishing|Cooked|Hatching|Meandering|Sublimating|Perambulating|Transfiguring|Elucidating|Processing|Wandering|Exploring|Osmosing|Vibing|GATE|GREEN|RED|bypass|idle|Compacting|Error|killed|zsh|❯|What should Claude do|Press up to edit|Context left)' | tail -1)
    
    W="$W P$p:${ST:-?}"

    # 1. Recovery cho máy chết
    if echo "$LAST_LINE" | grep -qE '(zsh|killed|closed|command not found)'; then
      DEAD_WORKERS="$DEAD_WORKERS $p"
    fi

    # 2. ⚡ AUTO-KICK FORCE: Nếu đứng rình quá lâu hoặc cần nén bộ nhớ
    # Check if we are at a prompt or asking for input
    if echo "$BUFFER" | grep -qE '(❯|What should Claude do|Context left until auto-compact|bypass permissions on)'; then
        # Kiểm tra sự thay đổi màn hình (Checksum)
        CK_PATH="/tmp/p$p_checksum.txt"
        CUR_CK=$(echo "$BUFFER" | cksum | awk '{print $1}')
        OLD_CK=$(cat "$CK_PATH" 2>/dev/null)
        
        if [ "$CUR_CK" = "$OLD_CK" ]; then
            echo "[$TS] 🚨 P$p STALLED (Stasis) — Super Kick active!"
            # Gửi dãy phím phá băng: Ctrl+C (để huỷ input treo) -> Enter -> Enter
            tmux send-keys -t ${SESSION}:0.$p C-c
            sleep 0.5
            tmux send-keys -t ${SESSION}:0.$p Enter
            sleep 0.5
            tmux send-keys -t ${SESSION}:0.$p Enter
        fi
        echo "$CUR_CK" > "$CK_PATH"
    fi
  done

  P0=$(tmux capture-pane -t ${SESSION}:0.0 -p -S -2 2>/dev/null | grep -oE '(AUTO-CTO|DETECTED|DISPATCHED|Cycle|ERROR|GATE)' | tail -1)
  LAST=$(tail -1 "$PROXY_LOG" 2>/dev/null | grep -oE '(🚀|✅|❌|🚫).*' | head -1)

  echo "[$TS] C$CYCLE | $STATS |$W | P0:${P0:-ok} | ${LAST:-.}"

  # === AUTO-RECOVERY: Dead workers ===
  for p in $DEAD_WORKERS; do
    echo "[$TS] 🔄 P$p DEAD — respawning CC CLI..."
    tmux send-keys -t ${SESSION}:0.$p "cd $MEKONG && claude --dangerously-skip-permissions" Enter
    sleep 3
  done

  # === EVERY 5 CYCLES: Full Status Report ===
  if [ $((CYCLE % 5)) -eq 0 ]; then
    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║  [$TS] 用間 P0 FULL STATUS REPORT — Cycle $CYCLE"
    echo "╠══════════════════════════════════════════════════════════════╣"

    # --- VERCEL ---
    echo "║ 🔺 VERCEL DEPLOYMENTS:"
    cd "$MEKONG"
    vercel ls 2>/dev/null | grep -E '(Ready|Error|Building|Queued)' | head -5 | while read line; do
      echo "║   $line"
    done

    # --- GIT ---
    echo "║"
    echo "║ 📦 GIT (last 5 commits):"
    git log --oneline -5 2>/dev/null | while read line; do
      echo "║   $line"
    done

    # --- SUPABASE ---
    echo "║"
    echo "║ 🗄️  SUPABASE STATUS:"
    for REF in $SB_PROJECTS; do
      SB_STATUS=$(supabase inspect db index-usage --project-ref "$REF" 2>&1 | head -1)
      SB_NAME=$(supabase projects list 2>/dev/null | grep "$REF" | awk '{print $7}')
      if echo "$SB_STATUS" | grep -q "Error\|error\|failed"; then
        echo "║   ❌ ${SB_NAME:-$REF}: $SB_STATUS"
      else
        echo "║   ✅ ${SB_NAME:-$REF}: healthy"
      fi
    done

    # --- ANTIGRAVITY PROXY (9191) ---
    echo "║"
    echo "║ 🚀 ANTIGRAVITY PROXY (9191):"
    AG_HEALTH=$(curl -s http://localhost:9191/health 2>/dev/null)
    if [ -z "$AG_HEALTH" ]; then
      echo "║   ❌ AG Proxy DOWN"
    else
      echo "$AG_HEALTH" | python3 -c "
import sys,json
try:
  d=json.load(sys.stdin)
  for acc in d.get('accounts',[]):
    email = acc.get('email','?')
    models = acc.get('models',{})
    avail = sum(1 for m,v in models.items() if v.get('remaining','0%') != '0%')
    total = len(models)
    print(f'║   {email}: {avail}/{total} models available')
except: print('║   AG parse error')
" 2>/dev/null
    fi

    # --- GATE RESULTS ---
    echo "║"
    echo "║ 🚧 CI/CD GATE LOG (last 5):"
    GATE_FILE="$MEKONG/apps/openclaw-worker/.gate-results.json"
    if [ -f "$GATE_FILE" ]; then
      python3 -c "
import json
with open('$GATE_FILE') as f:
  results = json.load(f)
for r in results[-5:]:
  icon = '✅' if r['buildPass'] else '❌'
  push = '📤' if r.get('pushed') else '—'
  print(f'║   {icon} {r[\"project\"]}/{r[\"missionId\"]} {push} ({r[\"ts\"][:19]})')
" 2>/dev/null || echo "║   (no gate results yet)"
    else
      echo "║   (no gate results yet)"
    fi

    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
  fi

  sleep 30
done
