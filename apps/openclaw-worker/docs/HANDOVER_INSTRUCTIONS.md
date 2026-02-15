# 🦞 OpenClaw Worker Handover Instructions
**Product:** OpenClaw Worker (Tôm Hùm Branch)
**Version:** v3.0.0 (Serena Integrated)
**Date:** 2026-02-13

This document contains instructions for deploying and maintaining the OpenClaw Worker.

---

## 1. 🛑 Environment Setup (Secrets)

Ensure the following secrets are set in your Cloudflare Worker environment (or `.dev.vars` for local dev):

```bash
# Telegram Bot Token (from BotFather)
npx wrangler secret put TELEGRAM_BOT_TOKEN

# Allowed User IDs (Comma-separated, e.g. "123456,789012")
npx wrangler secret put ALLOWED_USER_IDS

# Bridge URL (Optional - for local MacBook bridge)
# Example: https://my-bridge.serveo.net
npx wrangler secret put BRIDGE_URL
```

**Verify `wrangler.toml` (or `wrangler.jsonc`) bindings:**
- `ai`: Must be bound to `AI`.
- `compatibility_date`: Should be recent (e.g. `2026-01-31`).

---

## 2. 🚀 Deployment

To deploy the worker to Cloudflare network:

```bash
# 1. Type Check (Optional but recommended)
npx tsc --noEmit

# 2. Deploy
npm run deploy
# or
npx wrangler deploy
```

---

## 3. 🧪 Verification Commands

Run these checks to ensure the system is operational.

### 3.1 Unit Tests
```bash
npm test
```

### 3.2 Live Health Check via Telegram
Send `/status` to your bot.
**Expected Output:**
```
📊 System Status
🟢 Worker: Online (v3.0)
🟢 AI: Llama 3.1 Active
🟢 Connected Bridge: https://... (if configured)
⏰ 2026-02-13T...
```

### 3.3 Semantic Code Analysis (Serena Bridge)
If running locally with Bridge connected:
```bash
# In Telegram
/delegate find_symbol --name handleTelegramWebhook --file src/index.ts
```

---

## 4. 📂 Project Snapshot

**Key Files:**
- `src/index.ts`: Main logic (Telegram handling, AI routing, Bridge delegation).
- `worker-configuration.d.ts`: Type definitions for bindings.
- `scripts/serena-bridge.py`: Semantic analysis bridge (runs on local machine).
- `package.json`: Dependencies and scripts.

---

**End of Instructions.**
