---
title: Quick Start
description: Ship your first feature in 15 minutes with Mekong-CLI
section: getting-started
category: getting-started
order: 4
published: true
ai_executable: true
---

# Quick Start

---

## 🤖 Quick Execute

```
Execute: https://agencyos.network/docs/getting-started/quick-start
```



Ship your first agency automation in 15 minutes with Mekong-CLI.

## Video Demo

<div style="text-align: center; padding: 3rem; background: var(--color-bg-tertiary); border-radius: 0.75rem; border: 1px solid var(--color-border); margin-bottom: 1rem;"><div style="font-size: 3rem; margin-bottom: 1rem;">🌊</div><h3 style="margin: 0 0 0.5rem 0;">Demo Video Coming Soon</h3><p style="margin: 0; color: var(--color-text-muted);">Check our documentation to get started</p></div>

## Prerequisites

- Mekong-CLI installed (`python main.py --help` works)
- Python 3.8+
- Project initialized

**Don't have these?** See [Installation Guide](/docs/getting-started/installation)

## Your First Agency Project

### Step 1: Initialize Project

```bash
# Clone and setup
git clone https://github.com/longtho638-jpg/mekong-cli.git
cd mekong-cli
pip install -r requirements.txt

# Initialize new agency project
python main.py init my-agency
cd my-agency
```

**Created:**
- Project directory from template
- Configuration files
- Agent setup files

### Step 2: Configure Your Vibe

```bash
# Set up regional voice/tone
python main.py setup-vibe --location "Can Tho"
```

**Select your niche:**
| # | Niche | Description |
|---|-------|-------------|
| 1 | 🌾 rice-trading | Lúa Gạo |
| 2 | 🐟 fish-seafood | Cá Tra |
| 3 | 🛋️ furniture | Nội Thất |
| 4 | 🏗️ construction | Vật Liệu XD |
| 5 | 🚜 agriculture | Máy Nông Nghiệp |

### Step 3: Check Your AI Agents

```bash
python main.py agents
```

**Output:**
```
🌊 MEKONG-CLI AI Agents

   Quad-Agent System:
      🔍 Scout: Thu thập thông tin [Ready]
      ✏️ Editor: Biên tập nội dung [Ready]
      🎬 Director: Đạo diễn video [Ready]
      🤝 Community: Đăng bài & tương tác [Ready]

   Mekong-Specific Agents:
      📊 Market Analyst: Phân tích giá nông sản [Ready]
      💬 Zalo Integrator: Tích hợp Zalo OA [Ready]
      🎤 Local Copywriter: Content giọng địa phương [Ready]

   Total: 7 agents ready
```

### Step 4: Setup Secrets

```bash
python main.py generate-secrets
```

**Prompts for:**
- SUPABASE_URL
- SUPABASE_KEY  
- GOOGLE_API_KEY
- OPENROUTER_API_KEY
- ELEVENLABS_API_KEY

### Step 5: Activate License (Optional)

```bash
# For Pro features
python main.py activate --key mk_live_xxxxx
```

### Step 6: Deploy

```bash
python main.py deploy
```

## CLI vs Slash Commands

> **Important**: Mekong-CLI and AgencyOS IDE slash commands are different systems.

| Feature | Mekong-CLI | AgencyOS IDE |
|---------|------------|-------------|
| **Entry** | `python main.py` | Slash commands `/cook` |
| **Runs in** | Any terminal | AgencyOS IDE IDE |
| **Focus** | Agency automation | Development workflows |
| **Commands** | `init`, `agents`, `deploy` | `/cook`, `/plan`, `/fix` |

**Slash commands** (`/cook`, `/plan`, `/fix`) require **AgencyOS IDE IDE** with AgencyOS installed.

**Mekong-CLI** is a standalone Python CLI for agency automation.

## What Just Happened?

**Traditional approach** (8-12 hours):
1. Research tools and templates (2h)
2. Setup configuration (2h)
3. Configure integrations (2h)
4. Build automations (3h)
5. Debug issues (2h)

**Mekong-CLI approach** (15 minutes):
1. Clone + Install (2 min)
2. Init project (1 min)
3. Configure vibe (2 min)
4. Setup secrets (5 min)
5. Deploy (5 min)

**Time saved**: 8+ hours → **~3000% faster**

## Available Commands

```bash
# Project Management
python main.py init <name>           # Initialize project
python main.py setup-vibe            # Configure AI voice/tone
python main.py generate-secrets      # Create .env file
python main.py mcp-setup             # Setup MCP servers

# Deployment
python main.py deploy                # Deploy to Cloud Run

# License
python main.py activate --key KEY   # Activate license
python main.py status               # Show license status

# Info & Debug
python main.py agents               # Show AI agents
python main.py costs                # Show cost analysis
python main.py vibes                # Show vibe options
python main.py run-scout <feature>  # Test Scout agent
```

## Next Steps

1. 📖 **[CLI Reference](/docs/docs/cli)** - All 11 commands documented
2. 🤖 **[AI Agents](/docs/agents)** - Meet your 7 AI agents
3. 🏯 **[Binh Pháp Strategy](/docs/docs/binh-phap)** - Win-without-fighting approach
4. 💰 **[ROI Calculator](/roi-calculator)** - Calculate your savings

## Common Questions

**Q: Does it work with my tech stack?**
A: Mekong-CLI is Python-based and stack-agnostic. It automates agency operations, not code generation.

**Q: What if I want code generation features?**
A: Install AgencyOS in AgencyOS IDE IDE for `/cook`, `/plan`, `/fix` commands.

**Q: Do I need API keys?**
A: For basic features, no. For advanced (Gemini, ElevenLabs), yes.

---

**You just set up agency automation in 15 minutes.** Traditional tools can't do that.

**Ready to automate?** Your AI team is waiting.

---

## 🏯 Binh Pháp Alignment

> **軍爭篇** (Quân Tranh) - Speed - Quick execution

### Zero-Effort Commands

| Gõ lệnh | Auto-execute |
|---------|--------------|
| `/init` | Tự setup AgencyOS |
| `/plan` | Tự tạo plan |
| `/ship` | Tự deploy |

📖 [Xem tất cả Commands](/docs/commands)
