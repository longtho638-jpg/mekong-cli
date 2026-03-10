#!/bin/bash
# M1 DEEP 10x COOLING LOOP — 10s cycle, 15+ targets
echo "🔥❄️ M1 DEEP 10x COOLER — $(date) — PID: $$"
CYCLE=0
while true; do
  CYCLE=$((CYCLE + 1))
  pkill -f "node.*jest" 2>/dev/null
  pkill -f "node.*vitest" 2>/dev/null
  pkill -f "npm run test" 2>/dev/null
  pkill -f "node.*webpack.*watch" 2>/dev/null
  rm -rf ~/Library/Caches/com.apple.Safari/WebKitCache/ ~/Library/Caches/com.apple.QuickLookDaemon/ ~/Library/Caches/Google/Chrome/Default/Cache/ ~/Library/Caches/com.microsoft.VSCode/Cache*/ ~/Library/Caches/com.apple.DeveloperTools/ ~/Library/Caches/com.apple.nsurlsessiond/ ~/Library/Caches/CloudKit/ ~/Library/Caches/pip/ ~/Library/Caches/Homebrew/ ~/.npm/_cacache/ ~/mekong-cli/.claude/cache/ 2>/dev/null
  find ~/mekong-cli/apps -maxdepth 3 -name ".cache" -type d -exec rm -rf {} + 2>/dev/null
  find ~/mekong-cli -maxdepth 2 -name ".next" -type d -exec rm -rf {} + 2>/dev/null
  find /tmp -maxdepth 1 -not -name 'tmux-*' -not -name '.' -type f -mmin +1 -delete 2>/dev/null
  if [ $((CYCLE % 6)) -eq 0 ]; then
    FREE=$(vm_stat | awk '/Pages free/ {print $3}' | tr -d '.')
    DISK=$(df -h / | tail -1 | awk '{print $4}')
    echo "❄️ [$(date +%T)] #${CYCLE} RAM:${FREE} SSD:${DISK}"
  fi
  sleep 10
done
