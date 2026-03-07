#!/usr/bin/env bash
# 🦞 Switch CC CLI → DashScope Free (20 models, $0)
# Chạy 1 lần: ./switch-to-qwen.sh — CC CLI dùng ĐIỀU 57 rotation
set -euo pipefail

SETTINGS="$HOME/.claude/settings.json"

echo "🔄 Switching to DashScope Free (20 models, ĐIỀU 57)..."

# Backup current
cp "$SETTINGS" "$SETTINGS.bak" 2>/dev/null || true

# Switch model + API
python3 -c "
import json
with open('$SETTINGS') as f: d = json.load(f)
d['model'] = 'qwen3.5-plus'
# Set base URL to DashScope Coding endpoint
env = d.get('env', {})
env['ANTHROPIC_BASE_URL'] = 'http://localhost:9191'
d['env'] = env
with open('$SETTINGS', 'w') as f: json.dump(d, f, indent=2)
"

echo "✅ Model: qwen3.5-plus (primary)"
echo "✅ API: DashScope via Antigravity Proxy (port 9191)"
echo "✅ ĐIỀU 57: ACTIVE — 20 models round-robin"
echo "✅ Pool: qwen3.5-plus, coder-plus, coder-next, coder-480b,"
echo "         kimi-k2.5, MiniMax-M2.5, glm-5, glm-4.7,"
echo "         qwen3.5-flash, qwq-plus, qwen-vl-max, +9 more"
echo ""
echo "⚠️  Restart CC CLI or switch model in-session:"
echo "    tmux send-keys -t tom_hum:0.0 '/model qwen3.5-plus' Enter"
echo "    tmux send-keys -t tom_hum:0.1 '/model qwen3-coder-plus' Enter"
echo "    tmux send-keys -t tom_hum:0.2 '/model kimi-k2.5' Enter"
echo ""
echo "🎁 Need DashScope API Key? Sign up with free credits:"
echo "   https://www.alibabacloud.com/campaign/benefits?referral_code=A9245T"
