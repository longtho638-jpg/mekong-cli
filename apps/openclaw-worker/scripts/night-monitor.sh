#!/usr/bin/env bash
# 🌙 Night Monitor v2 — Giám sát + AUTO-INJECT TASKS khi idle
# CTO vô dụng → Night Monitor thay CTO bơm task
# Interval: 2 phút (aggressive)

LOG=~/tom_hum_night.log
SESSION="tom_hum:brain"

DIRS=("$HOME/mekong-cli" "$HOME/mekong-cli/apps/well" "$HOME/mekong-cli/apps/algo-trader" "$HOME/mekong-cli/apps/apex-os")

# 🔒 TASKS cho mỗi pane — khi idle sẽ auto-inject
TASKS=(
  '/cook "AGI Agentic RESEARCH-DRIVEN: dùng MCP context7 + web search tìm nguồn thực tế, tạo .claude/skills cho mọi domain. Commit." --auto'
  '/cook "Well AGI RaaS: fix i18n, Supabase, PayOS. Commit." --auto'
  '/cook "AGI Arbitrage: multi-exchange Binance/OKX/Bybit spread detector execution engine. Commit." --auto'
  '/cook "Apex-OS RaaS AGI: chuyển SaaS sang RaaS, crypto fee platform, zero-fee exchange. Commit." --auto'
)

echo "$(date '+%Y-%m-%d %H:%M:%S') 🌙 Night Monitor v2 STARTED (aggressive, 2min interval)" >> "$LOG"

while true; do
  TS=$(date '+%H:%M:%S')
  echo "" >> "$LOG"
  echo "=== $TS CHECK ===" >> "$LOG"

  # CTO check
  if pgrep -f "task-watcher" > /dev/null 2>&1; then
    echo "CTO: ✅" >> "$LOG"
  else
    echo "CTO: ❌ restarting..." >> "$LOG"
    cd ~/mekong-cli/apps/openclaw-worker && TOM_HUM_BRAIN_MODE=tmux nohup node task-watcher.js >> ~/tom_hum_cto.log 2>&1 &
  fi

  # Proxy check
  if curl -s http://localhost:9191/health 2>/dev/null | grep -q '"status":"ok"'; then
    echo "PROXY: ✅" >> "$LOG"
  else
    echo "PROXY: ❌ restarting..." >> "$LOG"
    pkill -f "antigravity-claude-proxy" 2>/dev/null
    sleep 2
    cd /opt/homebrew/lib/node_modules/antigravity-claude-proxy && nohup node src/index.js > /tmp/proxy.log 2>&1 &
  fi

  for i in 0 1 2 3; do
    OUTPUT=$(tmux capture-pane -t "${SESSION}.$i" -p -S -10 2>/dev/null)

    # 💀 Dead pane
    if echo "$OUTPUT" | grep -q "Pane is dead"; then
      echo "P$i: 💀 DEAD — respawning + inject task" >> "$LOG"
      tmux respawn-pane -k -t "${SESSION}.$i" "cd ${DIRS[$i]} && claude --dangerously-skip-permissions"
      sleep 8
      tmux send-keys -t "${SESSION}.$i" -l "${TASKS[$i]}"
      sleep 0.3
      tmux send-keys -t "${SESSION}.$i" Enter
      continue
    fi

    # 🔴 Bash prompt (CC CLI crashed)
    if echo "$OUTPUT" | tail -3 | grep -qE 'macbookprom1@.*%\s*$'; then
      echo "P$i: 🔴 CRASHED — restarting CC CLI + inject task" >> "$LOG"
      tmux send-keys -t "${SESSION}.$i" "cd ${DIRS[$i]} && claude --dangerously-skip-permissions" Enter
      sleep 8
      tmux send-keys -t "${SESSION}.$i" -l "${TASKS[$i]}"
      sleep 0.3
      tmux send-keys -t "${SESSION}.$i" Enter
      continue
    fi

    # 🟡 Context low (< 10%) — restart fresh
    if echo "$OUTPUT" | grep -qE 'Context low.*[0-9]% remaining'; then
      PCT=$(echo "$OUTPUT" | grep -oE '[0-9]+% remaining' | grep -oE '[0-9]+')
      if [ "$PCT" -le 5 ] 2>/dev/null; then
        echo "P$i: 🟡 CONTEXT ${PCT}% — restarting fresh + inject" >> "$LOG"
        tmux respawn-pane -k -t "${SESSION}.$i" "cd ${DIRS[$i]} && claude --dangerously-skip-permissions"
        sleep 8
        tmux send-keys -t "${SESSION}.$i" -l "${TASKS[$i]}"
        sleep 0.3
        tmux send-keys -t "${SESSION}.$i" Enter
        continue
      fi
    fi

    # 🔵 Pending action (git push, queued messages, Press up) — AUTO-ENTER
    if echo "$OUTPUT" | grep -qE '❯ git (push|commit|add)|queued messages|Press up to edit'; then
      echo "P$i: 🔵 PENDING ACTION — sending Enter" >> "$LOG"
      tmux send-keys -t "${SESSION}.$i" Escape
      sleep 0.3
      tmux send-keys -t "${SESSION}.$i" Enter
      continue
    fi

    # ⏸️ Idle (❯ prompt with no activity) — AUTO-INJECT TASK
    LAST_LINE=$(echo "$OUTPUT" | grep -v '^$' | tail -1)
    if echo "$OUTPUT" | grep -qE '^❯\s*$'; then
      echo "P$i: ⏸️ IDLE — AUTO-INJECTING /cook task" >> "$LOG"
      tmux send-keys -t "${SESSION}.$i" -l "${TASKS[$i]}"
      sleep 0.3
      tmux send-keys -t "${SESSION}.$i" Enter
      continue
    fi

    # ✅ Working
    STATUS=$(echo "$OUTPUT" | grep -oE '(Whisking|Bloviating|Churning|Crystallizing|Choreographing|Sprouting|Deciphering|Prestidigitating|Puttering|Nesting|Crafting|Crunched|Warping|Flowing|Sock-hopping|Building)' | tail -1)
    if [ -n "$STATUS" ]; then
      echo "P$i: ✅ WORKING — $STATUS" >> "$LOG"
    else
      echo "P$i: 🔵 ACTIVE" >> "$LOG"
    fi
  done

  sleep 120  # 2 minutes (aggressive)
done
