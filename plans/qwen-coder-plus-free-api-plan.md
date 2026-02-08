# 🐉 Qwen Bridge Proxy — Integration Status Report

## ✅ COMPLETED Infrastructure

### 1. Qwen Bridge Proxy (Custom Built)

**Location:** `~/.gemini/antigravity/scratch/qwen-bridge/`

A zero-dependency Node.js proxy that converts:

- **Anthropic Messages API** → **OpenAI Chat Completions API** → **Qwen/DashScope**

Features:

- ✅ Full Anthropic Messages format conversion
- ✅ Streaming support (SSE)
- ✅ Tool use / function calling conversion
- ✅ System message handling
- ✅ Qwen `<think>` tag stripping
- ✅ Model mapping (`qwen-coder-plus` → `qwen3-coder-plus`)
- ✅ Dual provider support (DashScope + Qwen OAuth)
- ✅ Health check endpoint
- ✅ Request statistics

### 2. CLI Tools Installed

- ✅ `@qwen-code/qwen-code` v0.2.1 (global)
- ✅ `claude-adapter` v2.1.0 (global, backup converter)
- ✅ Qwen OAuth creds exist at `~/.qwen/oauth_creds.json` (EXPIRED)

### 3. CC CLI Settings Variant

**File:** `cc-cli-qwen-settings.json`
Ready-to-use settings for running CC CLI on Qwen DRAGON tier.

---

## ⏳ NEEDS YOUR ACTION: Get API Credentials

The Qwen OAuth token from November 2025 has expired. Choose ONE:

### Option A: DashScope API Key (RECOMMENDED — most stable)

1. Go to: https://account.alibabacloud.com/register/intl_register.htm
2. Click "Sign up with Google" or "Sign up with GitHub"
3. Activate "Model Studio" in the console
4. Create API Key
5. Save it:
   ```bash
   echo 'YOUR_KEY' > ~/.qwen/dashscope_key
   ```

**Free tier:** 1M tokens for 90 days + ongoing campaigns (70M tokens for Qwen3)

### Option B: Refresh Qwen OAuth (fastest, less stable)

1. Go to: https://chat.qwen.ai
2. Click "Log in" → "Continue with Google"
3. After login, the `qwen` CLI will work with refreshed tokens

### Option C: Use `claude-adapter` wizard

```bash
claude-adapter
```

This launches an interactive wizard to configure model mappings.

---

## 🚀 How to Run (after credentials)

```bash
# With DashScope key:
cd ~/.gemini/antigravity/scratch/qwen-bridge
DASHSCOPE_API_KEY=$(cat ~/.qwen/dashscope_key) node proxy.mjs

# Then in another terminal:
export ANTHROPIC_BASE_URL=http://localhost:8045
export ANTHROPIC_AUTH_TOKEN=test
export ANTHROPIC_MODEL=qwen-coder-plus
claude --dangerously-skip-permissions
```

---

## 📊 Cost Comparison

| Model               | Input/1M tokens | Output/1M tokens | Free Tier           |
| ------------------- | --------------- | ---------------- | ------------------- |
| **Qwen Coder Plus** | $0.50           | $1.00            | 1M free + campaigns |
| Claude Sonnet 4     | $3.00           | $15.00           | None                |
| Claude Opus 4       | $15.00          | $75.00           | None                |
| Gemini 2.5 Pro      | $1.25           | $10.00           | Limited             |

**Qwen is 6-75x cheaper than Claude for coding tasks!**

---

## 🏗️ Architecture

```
CC CLI (Anthropic Messages API)
    ↓
Qwen Bridge Proxy (:8045)
    ↓ (converts Anthropic → OpenAI format)
DashScope / chat.qwen.ai
    ↓
Qwen3 Coder Plus (1M context, coding-optimized)
```

## Files Created

```
~/.gemini/antigravity/scratch/qwen-bridge/
├── proxy.mjs                    # Main proxy server (zero deps)
├── package.json                 # Package metadata
├── start.sh                     # Quick start script
├── setup-credentials.sh         # Credential setup helper
└── cc-cli-qwen-settings.json    # CC CLI settings variant
```
