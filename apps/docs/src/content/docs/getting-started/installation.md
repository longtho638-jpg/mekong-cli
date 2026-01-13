---
title: Installation
description: How to install Mekong-CLI - Deploy Your Agency in 15 Minutes
section: getting-started
category: getting-started
order: 2
published: true
ai_executable: true
---

# Installation

---

## 🤖 Quick Execute

```
Execute: https://agencyos.network/docs/getting-started/installation
```



Get started with Mekong-CLI and automate your agency operations.

## Video Guide

<div style="text-align: center; padding: 3rem; background: var(--color-bg-tertiary); border-radius: 0.75rem; border: 1px solid var(--color-border); margin-bottom: 1rem;"><div style="font-size: 3rem; margin-bottom: 1rem;">🌊</div><h3 style="margin: 0 0 0.5rem 0;">Demo Video Coming Soon</h3><p style="margin: 0; color: var(--color-text-muted);">Check our documentation to get started</p></div>

## Prerequisites

Before installing, ensure you have:

- **Python** 3.8 or higher
- **Git** for cloning the repository
- **pip** for installing dependencies
- **API Keys** (optional): Supabase, OpenRouter, ElevenLabs for full features

## Quick Installation

### Step 1: Clone the Repository

```bash
# Clone Mekong-CLI
git clone https://github.com/longtho638-jpg/mekong-cli.git

# Navigate to directory
cd mekong-cli
```

### Step 2: Install Dependencies

```bash
# Install Python dependencies
pip install -r requirements.txt
```

### Step 3: Verify Installation

```bash
# Show available commands
python main.py --help

# Show AI agents status
python main.py agents
```

**Expected output:**
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

### Step 4: (Optional) Activate Pro License

```bash
# Activate with your license key
python main.py activate --key mk_live_xxxxx
```

Get your license key from [agencyos.network/pricing](/pricing).

## CLI Commands

Mekong-CLI uses Typer for a rich command-line experience:

```bash
# Initialize new project
python main.py init my-agency

# Configure AI voice/tone (Miền Tây, Gen Z, etc.)
python main.py setup-vibe --location "Can Tho"

# Setup MCP servers
python main.py mcp-setup

# Generate secrets (.env file)
python main.py generate-secrets

# Show cost analysis
python main.py costs

# Show available vibes
python main.py vibes

# Deploy to Cloud Run
python main.py deploy
```

## Core Modules

The `/core/` directory contains **154+ automation modules**:

| Module | Description |
|--------|-------------|
| `marketing_hub.py` | Marketing automation & campaigns |
| `sales_hub.py` | Sales pipeline & CRM |
| `finance_hub.py` | Invoicing, expense tracking |
| `strategy_officer.py` | Binh Pháp strategic planning |
| `crm.py` | Customer relationship management |
| `analytics.py` | Data analytics & reporting |
| `proposal_generator.py` | AI proposal creation |
| `content_generator.py` | Content creation automation |

These modules are used internally by CLI commands - not run directly.

## IDE Integration (Recommended)

### Cursor IDE
[![Open in Cursor](https://img.shields.io/badge/Open%20in-Cursor-blue?style=for-the-badge&logo=cursor)](https://cursor.com)

1. Open Cursor IDE
2. Clone: `git clone https://github.com/longtho638-jpg/mekong-cli.git`
3. Open the folder in Cursor
4. Use integrated terminal for CLI commands

### VS Code
1. Open VS Code
2. Clone and open the mekong-cli folder
3. Install Python extension
4. Use integrated terminal

## Troubleshooting

### Python not found
```bash
# Check Python version
python --version

# If not found, install Python 3.8+
# macOS: brew install python
# Ubuntu: sudo apt install python3
# Windows: Download from python.org
```

### Typer/Rich not installed
```bash
# Install required packages
pip install typer rich
```

### Permission errors
```bash
# Use pip with user flag
pip install --user -r requirements.txt
```

### License activation failed
- Check your license key format: `mk_live_xxxxx`
- Ensure internet connection
- Contact support@agencyos.network

## Next Steps

After installation:

1. 📖 Read the [Quick Start Guide](/docs/getting-started/quick-start)
2. 🤖 Explore [7 AI Agents](/docs/agents)
3. 📋 Browse [85+ Commands](/commands)
4. 🖥️ Try the [Interactive Demo](/demo)

---

**Need help?** Contact us at [hello@agencyos.network](mailto:hello@agencyos.network)

---

## 🏯 Binh Pháp Alignment

> **地形篇** (Địa Hình) - Terrain - Setup environment

### Zero-Effort Commands

| Gõ lệnh | Auto-execute |
|---------|--------------|
| `/init` | Tự setup AgencyOS |
| `/plan` | Tự tạo plan |
| `/ship` | Tự deploy |

📖 [Xem tất cả Commands](/docs/commands)
