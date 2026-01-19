#!/bin/bash
# 🌊 Agency OS - Custom Statusline (Bash)
# Optimized for WOW go-live experience

input=$(cat)

# ---- Agency OS Metrics (Python Bridge) ----
# Reads data from local persistence for maximum speed
read_agency_stats() {
  python3 - <<'PY'
import json, os
from pathlib import Path

def get_stats():
    res = {"arr": 0, "moat": 0, "level": 3}
    try:
        # Cashflow
        cf_path = Path(".antigravity/cashflow/revenues.json")
        if cf_path.exists():
            data = json.loads(cf_path.read_text())
            # Simple ARR calculation logic mirrored from engine
            total_usd = sum(r.get("usd", 0) for r in data.get("revenues", []))
            res["arr"] = total_usd
            
        # Moat
        moat_path = Path(".antigravity/moats/moats_v2.json")
        if moat_path.exists():
            m_data = json.loads(moat_path.read_text())
            strengths = [v.get("s", 0) for v in m_data.values()]
            if strengths:
                res["moat"] = sum(strengths) // len(strengths)
    except: pass
    return res

stats = get_stats()
# Format: ARR|MOAT
print(f"{stats['arr']}|{stats['moat']}")
PY
}

# Fetch stats once per statusline render
AGENCY_DATA=$(read_agency_stats)
IFS='|' read -r CURRENT_ARR MOAT_STRENGTH <<< "$AGENCY_DATA"

# ---- Render Functions ----
progress_mini() {
  local val=$1; local target=1000000
  local pct=$(( val * 100 / target ))
  ((pct > 100)) && pct=100
  echo "$pct%"
}

# ---- git branch ----
git_branch=""
if git rev-parse --git-dir >/dev/null 2>&1;
  then
  git_branch=$(git branch --show-current 2>/dev/null || git rev-parse --short HEAD 2>/dev/null)
fi

# ---- basics (requires jq) ----
if command -v jq >/dev/null 2>&1;
  then
  current_dir=$(echo "$input" | jq -r '.workspace.current_dir // .cwd // "unknown"' 2>/dev/null | sed "s|^$HOME|~|g")
  model_name=$(echo "$input" | jq -r '.model.display_name // "Claude"' 2>/dev/null)
  
  # Context usage
  context_input=$(echo "$input" | jq -r '.context_window.total_input_tokens // 0' 2>/dev/null)
  context_size=$(echo "$input" | jq -r '.context_window.context_window_size // 200000' 2>/dev/null)
  context_pct=$(( context_input * 100 / context_size ))
else
  current_dir="agency-os"
  model_name="Claude"
  context_pct=0
fi

# ---- RENDER STATUSLINE ----

# 1. Location & Context
printf "📁 %s" "$current_dir"
[ -n "$git_branch" ] && printf " 🌿 %s" "$git_branch"

# 2. Agency OS Core Metrics (The WOW Factor)
ARR_PCT=$(progress_mini "$CURRENT_ARR")
printf " | 💰 $%'.0f (%s)" "$CURRENT_ARR" "$ARR_PCT"
printf " | 🏰 %d%%" "$MOAT_STRENGTH"

# 3. Model & Health
printf " | 🤖 %s" "$model_name"
if [ "$context_pct" -ge 80 ]; then
  printf " 🔴 %d%%" "$context_pct"
elif [ "$context_pct" -ge 50 ]; then
  printf " 🟡 %d%%" "$context_pct"
else
  printf " 🟢 %d%%" "$context_pct"
fi

printf "\n"