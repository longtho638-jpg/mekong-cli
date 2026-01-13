---
title: "CLI Reference"
description: "Detailed Mekong CLI command reference"
section: "docs"
ai_executable: true
---

# ⌨️ CLI Reference

> **11 commands to deploy your agency**

---

## 🤖 Quick Execute

```
Execute: https://agencyos.network/docs/cli
```

---

## ⚡ Installation (2 min)

```bash
# Clone
git clone https://github.com/longtho638-jpg/mekong-cli.git
cd mekong-cli

# Install
pip install -r requirements.txt

# Verify
mekong --help
```

---

## 📦 Project Commands

### `mekong init <name>`
```bash
mekong init my-agency
# Creates: my-agency/ with template
```

### `mekong setup-vibe`
```bash
mekong setup-vibe --location "Can Tho" --niche 1
# Configures AI voice for region
```

**Niches:**
| # | Niche |
|---|-------|
| 1 | 🌾 rice-trading |
| 2 | 🐟 fish-seafood |
| 3 | 🛋️ furniture |
| 4 | 🏗️ construction |
| 5 | 🚜 agriculture |
| 6 | 🏠 real-estate |
| 7 | 🍜 restaurants |
| 8 | 💅 beauty-spa |
| 9 | 🚗 automotive |
| 10 | 📚 education |

### `mekong generate-secrets`
```bash
mekong generate-secrets
# Creates .env with API keys
```

### `mekong mcp-setup`
```bash
mekong mcp-setup
# Installs MCP servers
```

---

## ☁️ Deployment

### `mekong deploy`
```bash
mekong deploy
# Deploys to Google Cloud Run
```

---

## 🔐 License

### `mekong activate`
```bash
mekong activate --key mk_live_pro_xxxxx
```

### `mekong status`
```bash
mekong status
# Shows: tier, quota, usage
```

**Tiers:**
| Tier | Videos/Day | Niches |
|------|------------|--------|
| Starter | 1 | 1 |
| Pro | 10 | 10 |
| Enterprise | ∞ | All |

---

## 🧪 Testing

### `mekong run-scout`
```bash
mekong run-scout "product launch"
```

### `mekong agents`
```bash
mekong agents
# Shows all 7 agents status
```

### `mekong costs`
```bash
mekong costs
# Shows AI cost savings
```

### `mekong vibes`
```bash
mekong vibes
# Lists: mien-tay, mien-bac, gen-z...
```

---

## ✅ Success Criteria

- [ ] CLI installed and working
- [ ] `mekong --help` runs
- [ ] Project initialized
- [ ] Deployment successful

---

**🏯 "Họ WIN → Mình WIN"**
