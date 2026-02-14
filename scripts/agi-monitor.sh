#!/bin/bash
# AGI Infinite Monitor v2 — Binh Phap Rule #0: Autonomous Surveillance
# Includes: Proxy health, Worker status, Vercel deploys, Git commits
# Runs forever: 60s cycles

CYCLE=0
PROXY_LOG="/Users/macbookprom1/proxy_v7.log"
MEKONG="/Users/macbookprom1/mekong-cli"
SESSION="tom_hum_brain"

while true; do
  CYCLE=$((CYCLE + 1))
  TS=$(date +%H:%M:%S)

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

  W=""
  DEAD_WORKERS=""
  for p in 1 2 3; do
    s=$(tmux capture-pane -t ${SESSION}:0.$p -p -S -5 2>/dev/null | grep -oE '(Sautéing|Cooking|Roosting|Herding|Forging|Simmering|Deciphering|Embellishing|Cooked|Hatching|Meandering|Sublimating|Perambulating|Transfiguring|Elucidating|Processing|Wandering|Exploring|Osmosing|Vibing|GATE|GREEN|RED|bypass|idle|Compacting|Error|killed|zsh)' | tail -1)
    W="$W P$p:${s:-?}"
    if [ "$s" = "zsh" ] || [ "$s" = "killed" ]; then
      DEAD_WORKERS="$DEAD_WORKERS $p"
    fi
  done

  P0=$(tmux capture-pane -t ${SESSION}:0.0 -p -S -2 2>/dev/null | grep -oE '(AUTO-CTO|DETECTED|DISPATCHED|Cycle|ERROR|GATE)' | tail -1)
  LAST=$(tail -1 "$PROXY_LOG" 2>/dev/null | grep -oE '(🚀|✅|❌|🚫).*' | head -1)

  echo "[$TS] C$CYCLE | $STATS |$W | P0:${P0:-ok} | ${LAST:-.}"

  for p in $DEAD_WORKERS; do
    echo "[$TS] 🔄 P$p DEAD — respawning CC CLI..."
    tmux send-keys -t ${SESSION}:0.$p "cd $MEKONG && claude --dangerously-skip-permissions" Enter
    sleep 3
  done

  if [ $((CYCLE % 5)) -eq 0 ]; then
    echo ""
    echo "[$TS] === VERCEL STATUS ==="
    cd "$MEKONG"
    VERCEL_OUT=$(npx -y vercel ls --prod 2>/dev/null | head -8)
    echo "$VERCEL_OUT"
    echo ""
    echo "[$TS] === GIT LOG (last 5) ==="
    git log --oneline -5 2>/dev/null
    echo ""
    echo "[$TS] === GATE LOG ==="
    if [ -f "$MEKONG/apps/openclaw-worker/.gate-results.json" ]; then
      python3 -c "
import json
with open('$MEKONG/apps/openclaw-worker/.gate-results.json') as f:
  results = json.load(f)
for r in results[-5:]:
  icon = '✅' if r['buildPass'] else '❌'
  push = '📤' if r.get('pushed') else '—'
  print(f'{icon} {r[\"project\"]}/{r[\"missionId\"]} {push} ({r[\"ts\"][:19]})')
" 2>/dev/null || echo "(no gate results yet)"
    else
      echo "(no gate results yet)"
    fi
    echo ""
  fi

  sleep 60
done
