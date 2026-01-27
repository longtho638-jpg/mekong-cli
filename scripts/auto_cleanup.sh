#!/bin/bash
# Auto Cleanup Script - Runs every 60 minutes via LaunchAgent
# Keeps Mac running smoothly for factory operations

LOG="/tmp/auto_cleanup.log"
echo "$(date '+%Y-%m-%d %H:%M:%S') - Starting cleanup..." >> "$LOG"

# 1. Kill stuck/zombie claude processes (keep only first 3)
CLAUDE_COUNT=$(pgrep -f "claude" | wc -l | tr -d ' ')
if [ "$CLAUDE_COUNT" -gt 5 ]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Too many claude processes ($CLAUDE_COUNT), cleaning..." >> "$LOG"
    pkill -f "claude.*dangerously" 2>/dev/null
fi

# 2. Kill stuck node processes (older than 2 hours)
NODE_COUNT=$(pgrep -f "node" | wc -l | tr -d ' ')
if [ "$NODE_COUNT" -gt 30 ]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Too many node processes ($NODE_COUNT), cleaning..." >> "$LOG"
    pkill -f "node.*claude-flow" 2>/dev/null
fi

# 3. Clear disk caches (no sudo needed)
sync 2>/dev/null

# 4. Clear temp files older than 1 day
find /tmp -name "claude*" -mtime +1 -delete 2>/dev/null
find /tmp -name "*.log" -mtime +7 -delete 2>/dev/null

# 5. Memory pressure check - if critical, kill heavy processes
MEM_PRESSURE=$(memory_pressure 2>/dev/null | grep "System-wide memory free percentage" | awk '{print $NF}' | tr -d '%')
if [ -n "$MEM_PRESSURE" ] && [ "$MEM_PRESSURE" -lt 10 ]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Memory critical ($MEM_PRESSURE%), emergency cleanup..." >> "$LOG"
    pkill -f "pyrefly" 2>/dev/null
    pkill -f "claude-flow" 2>/dev/null
fi

# 6. Report status
LOAD=$(uptime | awk -F'load averages:' '{print $2}' | awk '{print $1}')
echo "$(date '+%Y-%m-%d %H:%M:%S') - Cleanup complete. Load: $LOAD" >> "$LOG"

# Keep log small (last 100 lines)
tail -100 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"
