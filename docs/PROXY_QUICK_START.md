# 🚀 Antigravity Claude Proxy - Quick Start Guide

> **"Binh mã vị động, lương thảo tiên hành"** - Proxy before action
>
> Universal AI model routing for Claude Code CLI → Cost optimization with Gemini models

**Last Updated**: 2026-01-25
**Version**: 1.0.0
**Status**: Production Ready

---

## ⚡ INSTANT START (1 Command)

```bash
# Install globally
npm install -g antigravity-claude-proxy

# Start proxy (auto-config with defaults)
antigravity-claude-proxy start
```

**That's it!** Proxy running at `http://localhost:8080`

---

## 🎯 What Is This?

Antigravity Claude Proxy routes Claude Code CLI requests to **cost-optimized AI models** (Gemini Flash/Pro) while maintaining Claude API compatibility.

**WIN-WIN-WIN:**
- 👑 **Owner WIN**: 10x cheaper than Claude API (Gemini pricing)
- 🏢 **Agency WIN**: Unified interface for all models
- 🚀 **Client WIN**: Faster responses with 1M context window

---

## 📋 Prerequisites

| Requirement | Version | Check Command |
|-------------|---------|---------------|
| **Node.js** | 18+ | `node --version` |
| **npm** | 9+ | `npm --version` |
| **Gemini API Key** | Required | Get from [AI Studio](https://aistudio.google.com/app/apikey) |

---

## 🔧 Installation Methods

### Method 1: Global Install (Recommended)

```bash
# Install globally
npm install -g antigravity-claude-proxy

# Verify installation
antigravity-claude-proxy --version
```

### Method 2: From Source (Development)

```bash
# Clone repository
git clone https://github.com/longtho638-jpg/mekong-cli.git
cd mekong-cli

# Install dependencies
pnpm install

# Build proxy (if source available in monorepo)
cd antigravity-claude-proxy
npm install
npm run build
npm link  # Make globally available
```

### Method 3: npx (No Install)

```bash
# Run directly without installing
npx antigravity-claude-proxy start
```

---

## ⚙️ Configuration

### Step 1: Set Gemini API Key

```bash
# Add to your shell profile (~/.zshrc or ~/.bashrc)
export GEMINI_API_KEY="your_api_key_here"

# Or create .env file
echo "GEMINI_API_KEY=your_api_key_here" > ~/.antigravity/.env
```

**Get API Key**: [Google AI Studio](https://aistudio.google.com/app/apikey)

### Step 2: Configure Proxy Port (Optional)

```bash
# Default: 8080
# Custom port:
export ANTIGRAVITY_PROXY_PORT=3001
```

### Step 3: Set Default Model (Optional)

```bash
# Speed (default)
export ANTIGRAVITY_DEFAULT_MODEL="gemini-3-flash"

# Quality
export ANTIGRAVITY_DEFAULT_MODEL="gemini-3-pro-high"
```

---

## 🚀 Running the Proxy

### Basic Start

```bash
# Foreground (see logs)
antigravity-claude-proxy start

# Background (daemon mode)
antigravity-claude-proxy start --daemon

# Custom port
antigravity-claude-proxy start --port 3001
```

### Auto-Start with Init

```bash
# Interactive setup with best defaults
antigravity-claude-proxy init

# Non-interactive (auto-config)
antigravity-claude-proxy init --port 8080 --model gemini-3-flash --daemon
```

### Health Check

```bash
# Check if proxy is running
curl -s http://localhost:8080/health | jq

# Expected response:
# {
#   "status": "healthy",
#   "models": ["gemini-3-flash", "gemini-3-pro-high"],
#   "uptime": 3600
# }
```

---

## 🍎 macOS: Run as Background Service (LaunchAgent)

### Step 1: Create LaunchAgent plist

```bash
# Create plist file
cat > ~/Library/LaunchAgents/com.antigravity.proxy.plist <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.antigravity.proxy</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/node</string>
        <string>/opt/homebrew/bin/antigravity-claude-proxy</string>
        <string>start</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardErrorPath</key>
    <string>/Users/YOUR_USERNAME/.mekong/logs/proxy-error.log</string>
    <key>StandardOutPath</key>
    <string>/Users/YOUR_USERNAME/.mekong/logs/proxy-out.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>GEMINI_API_KEY</key>
        <string>YOUR_API_KEY_HERE</string>
        <key>PATH</key>
        <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
    </dict>
</dict>
</plist>
EOF

# Replace YOUR_USERNAME and YOUR_API_KEY_HERE
```

### Step 2: Load LaunchAgent

```bash
# Create log directory
mkdir -p ~/.mekong/logs

# Load service
launchctl load ~/Library/LaunchAgents/com.antigravity.proxy.plist

# Verify running
launchctl list | grep antigravity
```

### Step 3: Manage Service

```bash
# Stop service
launchctl stop com.antigravity.proxy

# Start service
launchctl start com.antigravity.proxy

# Unload service (disable auto-start)
launchctl unload ~/Library/LaunchAgents/com.antigravity.proxy.plist

# Reload service (after config changes)
launchctl unload ~/Library/LaunchAgents/com.antigravity.proxy.plist
launchctl load ~/Library/LaunchAgents/com.antigravity.proxy.plist
```

### Step 4: View Logs

```bash
# Real-time logs
tail -f ~/.mekong/logs/proxy-out.log

# Error logs
tail -f ~/.mekong/logs/proxy-error.log
```

---

## 🔗 Integrate with Claude Code CLI

### Step 1: Set Environment Variables

```bash
# Add to ~/.zshrc or ~/.bashrc
export ANTHROPIC_BASE_URL="http://localhost:8080"
export ANTHROPIC_AUTH_TOKEN="test"  # Any value works (proxy doesn't validate)

# Reload shell
source ~/.zshrc  # or source ~/.bashrc
```

### Step 2: Verify Integration

```bash
# Test with Claude Code CLI
claude --version

# Check proxy logs for incoming requests
tail -f ~/.mekong/logs/proxy-out.log
```

### Step 3: Test Model Routing

```bash
# Use default model (gemini-3-flash)
claude "What is 2+2?"

# Specify model explicitly
claude --model gemini-3-pro-high "Explain quantum computing"
```

---

## 🎛️ Available Models

| Model ID | Provider | Context | Speed | Cost | Use Case |
|----------|----------|---------|-------|------|----------|
| `gemini-3-flash` | Google | 1M tokens | ⚡ Fast | 💰 Cheap | Quick tasks, iterations |
| `gemini-3-pro-high` | Google | 1M tokens | 🧠 Deep | 💸 Moderate | Complex reasoning, planning |
| `claude-sonnet-4-5-thinking` | Anthropic | 200K tokens | ⚡ Fast | 💰💰 Standard | Claude Code default |
| `claude-opus-4-5-thinking` | Anthropic | 200K tokens | 🧠 Deep | 💰💰💰 Premium | Maximum quality |

**Cost Comparison** (per 1M input tokens):
- Gemini Flash: **$0.075** (10x cheaper)
- Gemini Pro: **$1.25** (similar to Sonnet)
- Claude Sonnet: **$3.00**
- Claude Opus: **$15.00**

---

## 📊 Web Console

Access at: `http://localhost:8080`

**Features:**
- 📈 Real-time health metrics
- 💳 Token bucket status (rate limiting)
- 🔑 API key management (multi-account)
- 📊 Usage statistics

**Screenshots:**
```
┌─────────────────────────────────────┐
│  Antigravity Proxy Dashboard        │
├─────────────────────────────────────┤
│  Status:     ✅ Healthy             │
│  Uptime:     3h 42m                 │
│  Requests:   1,234                  │
│  Models:     2 active               │
│                                     │
│  Token Buckets:                     │
│  ━━━━━━━━━━━━━━━━━━ 87% available  │
│                                     │
│  [Manage Accounts] [View Logs]     │
└─────────────────────────────────────┘
```

---

## 🐛 Troubleshooting

### Issue 1: "Command not found: antigravity-claude-proxy"

**Solution:**
```bash
# Check npm global bin location
npm config get prefix

# Add to PATH (add to ~/.zshrc)
export PATH="$(npm config get prefix)/bin:$PATH"

# Reload shell
source ~/.zshrc
```

### Issue 2: "Port 8080 already in use"

**Solution:**
```bash
# Find process using port 8080
lsof -ti:8080

# Kill process
kill -9 $(lsof -ti:8080)

# Or use different port
antigravity-claude-proxy start --port 3001
```

### Issue 3: "GEMINI_API_KEY not set"

**Solution:**
```bash
# Set API key
export GEMINI_API_KEY="your_key_here"

# Verify
echo $GEMINI_API_KEY

# Make permanent (add to ~/.zshrc)
echo 'export GEMINI_API_KEY="your_key_here"' >> ~/.zshrc
```

### Issue 4: "Connection refused" from Claude Code

**Solution:**
```bash
# 1. Check proxy is running
curl http://localhost:8080/health

# 2. Verify environment variables
echo $ANTHROPIC_BASE_URL  # Should be: http://localhost:8080
echo $ANTHROPIC_AUTH_TOKEN  # Should be: test (or any value)

# 3. Test proxy directly
curl -X POST http://localhost:8080/v1/messages \
  -H "Content-Type: application/json" \
  -d '{"model": "gemini-3-flash", "messages": [{"role": "user", "content": "test"}]}'
```

### Issue 5: LaunchAgent not starting

**Solution:**
```bash
# Check plist syntax
plutil -lint ~/Library/LaunchAgents/com.antigravity.proxy.plist

# View system logs
log show --predicate 'subsystem == "com.apple.launchd"' --last 5m | grep antigravity

# Manually test script
/opt/homebrew/bin/antigravity-claude-proxy start

# Check environment variables in plist
launchctl getenv GEMINI_API_KEY
```

### Issue 6: High latency / Slow responses

**Solution:**
```bash
# Check proxy health
curl http://localhost:8080/health | jq '.latency'

# Switch to faster model
export ANTIGRAVITY_DEFAULT_MODEL="gemini-3-flash"

# Restart proxy
antigravity-claude-proxy restart
```

---

## 🔍 Verify Everything Works

### Full Integration Test

```bash
# 1. Check proxy health
curl -s http://localhost:8080/health | jq
# Expected: {"status": "healthy"}

# 2. Check environment
echo $ANTHROPIC_BASE_URL
# Expected: http://localhost:8080

# 3. Test with Claude Code
claude "Calculate 123 * 456"
# Expected: Response from Gemini model

# 4. Check proxy logs
tail -n 20 ~/.mekong/logs/proxy-out.log
# Expected: See request logs

# 5. Verify model routing
curl http://localhost:8080/models | jq
# Expected: List of available models
```

---

## 🎓 Advanced Configuration

### Multi-Account Setup

```bash
# Add multiple Gemini API keys for quota pooling
antigravity-claude-proxy accounts add \
  --name "account-1" \
  --key "AIza..." \
  --quota 1000000

antigravity-claude-proxy accounts add \
  --name "account-2" \
  --key "AIza..." \
  --quota 500000
```

### Custom Model Aliases

```bash
# Create .antigravity/config.json
{
  "models": {
    "fast": "gemini-3-flash",
    "smart": "gemini-3-pro-high",
    "claude": "claude-sonnet-4-5-thinking"
  }
}

# Use alias
claude --model fast "Quick task"
```

### Rate Limiting Configuration

```bash
# Set custom rate limits
antigravity-claude-proxy config set \
  --rate-limit 60 \
  --rate-window 60000  # 60 requests per minute
```

---

## 📚 Related Documentation

### Internal Docs
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture (mentions proxy @ line 222, 586)
- [CLAUDE.md](../CLAUDE.md) - Proxy config in WIN-WIN-WIN rules (line 30, 70)
- [quota-optimization.md](../.claude/rules/00-core/quota-optimization.md) - Cost optimization strategy

### External Resources
- [Gemini API Docs](https://ai.google.dev/gemini-api/docs)
- [Claude API Docs](https://docs.anthropic.com/en/api)
- [Node.js Global Packages](https://docs.npmjs.com/downloading-and-installing-packages-globally)

---

## 🏯 WIN-WIN-WIN Validation

Before deploying to production, verify:

✅ **Owner WIN**:
- Gemini API key working
- Proxy reduces costs by 10x
- LaunchAgent auto-starts on reboot

✅ **Agency WIN**:
- Claude Code CLI routes through proxy
- All models accessible via unified interface
- Logs captured for debugging

✅ **Client WIN**:
- Response times < 2 seconds
- 1M context window available
- Stable uptime (99.9%+)

---

## 🚨 Production Checklist

- [ ] Gemini API key secured (not in version control)
- [ ] LaunchAgent configured and tested
- [ ] Logs rotating (prevent disk fill)
- [ ] Health monitoring enabled
- [ ] Firewall rules configured (if remote access needed)
- [ ] Backup API keys configured (failover)
- [ ] Rate limits set appropriately
- [ ] Environment variables in shell profile

---

## 📞 Support

**Issues**: Report at [GitHub Issues](https://github.com/longtho638-jpg/mekong-cli/issues)
**Docs**: [docs.agencyos.network](https://docs.agencyos.network)
**Community**: [discord.agencyos.network](https://discord.agencyos.network)

---

**Built with ❤️ by the Antigravity Team**
**Version**: 1.0.0 | **Status**: Production Ready | **License**: MIT
