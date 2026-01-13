---
title: Getting Started
description: "Deploy Your Agency in 15 Minutes with AgencyOS"
section: getting-started
order: 1
published: true
ai_executable: true
---

# Getting Started

---

## 🤖 Quick Execute

```
Execute: https://agencyos.network/docs/getting-started
```



Welcome to **AgencyOS** - the AI-powered agency operating system that helps you automate operations, scale efficiently, and build faster.

## Download & Install

### System Requirements

| Platform | Minimum Version | Notes |
|----------|-----------------|-------|
| **macOS** | 12 (Monterey) + | Apple Silicon recommended |
| **Windows** | 10 (64-bit) | Windows 11 fully supported |
| **Linux** | glibc >= 2.28 | Ubuntu 20+, Debian 10+, Fedora 36+ |
| **Python** | 3.8+ | Required for Mekong-CLI |

### Quick Install (CLI)

```bash
# Clone the repository
git clone https://github.com/longtho638-jpg/mekong-cli.git
cd mekong-cli

# Install dependencies
pip install -r requirements.txt

# Verify installation
python main.py --help
```

### Antigravity IDE (Recommended)

For the full AgencyOS experience, use with **Google Antigravity IDE**:

1. **Download**: Visit [antigravity.google/download](https://antigravity.google/download)
2. **Install**: Follow platform-specific instructions
3. **Open**: Clone mekong-cli and open in Antigravity

<div style="text-align: center; padding: 2rem; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 1rem; border: 1px solid rgba(255,255,255,0.1); margin: 2rem 0;">
  <div style="font-size: 2.5rem; margin-bottom: 1rem;">🚀</div>
  <h3 style="margin: 0 0 0.5rem 0; color: #fff;">Antigravity IDE + AgencyOS</h3>
  <p style="margin: 0; color: rgba(255,255,255,0.7);">The ultimate AI-powered development experience</p>
</div>

## Basic Navigation

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + E` | Open Agent Manager |
| `Cmd/Ctrl + K` | Command Palette |
| `Cmd/Ctrl + Shift + P` | All Commands |

### Agent Manager

The Agent Manager provides access to all 18 specialized AI agents:

1. **Scout Agent** - Research and information gathering
2. **Planner Agent** - Task planning and breakdown
3. **Code Agent** - Implementation and coding
4. **Tester Agent** - Testing and validation
5. **Debugger Agent** - Issue investigation
6. **Git Manager** - Version control
7. ... and 12 more specialized agents

Open Agent Manager: `Cmd + E` or click the agent icon

## First Commands

After installation, try these commands:

```bash
# Check available agents
python main.py agents

# Initialize a new project
python main.py init

# Configure regional vibe (VN localization)
python main.py setup-vibe --location "Can Tho"

# Generate environment secrets
python main.py generate-secrets
```

## What's Included

### Mekong-CLI Features

- 🤖 **18 AI Agents** - Specialized for different tasks
- 📋 **85+ Commands** - From planning to deployment
- 🇻🇳 **Vietnamese Localization** - Bilingual EN/VN support
- 🎯 **28 Business Commands** - Marketing, Sales, Strategy
- 🔧 **154+ Core Modules** - Automation for every workflow

### Binh Pháp Integration

AgencyOS integrates the **13 Binh Pháp Clusters** for strategic excellence:

| Cluster | Focus |
|---------|-------|
| Kế Hoạch | Strategic Planning |
| Mưu Công | Win-Without-Fighting |
| Thế Trận | Momentum Building |
| Cửu Biến | Adaptive Pivoting |
| Hỏa Công | Disruption Tactics |

Learn more: [Binh Pháp Framework](/docs/reference/binh-phap)

## Updates

AgencyOS automatically checks for updates. To manually update:

```bash
cd mekong-cli
git pull origin main
pip install -r requirements.txt
```

## Next Steps

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 2rem;">
  <a href="/docs/getting-started/installation" style="padding: 1.5rem; background: var(--color-bg-tertiary); border-radius: 0.75rem; border: 1px solid var(--color-border); text-decoration: none; color: inherit;">
    <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">📥</div>
    <strong>Installation</strong>
    <p style="font-size: 0.875rem; margin: 0.5rem 0 0 0; opacity: 0.7;">Detailed setup guide</p>
  </a>
  <a href="/docs/getting-started/quick-start" style="padding: 1.5rem; background: var(--color-bg-tertiary); border-radius: 0.75rem; border: 1px solid var(--color-border); text-decoration: none; color: inherit;">
    <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">⚡</div>
    <strong>Quick Start</strong>
    <p style="font-size: 0.875rem; margin: 0.5rem 0 0 0; opacity: 0.7;">5-minute tutorial</p>
  </a>
  <a href="/docs/agents" style="padding: 1.5rem; background: var(--color-bg-tertiary); border-radius: 0.75rem; border: 1px solid var(--color-border); text-decoration: none; color: inherit;">
    <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">🤖</div>
    <strong>AI Agents</strong>
    <p style="font-size: 0.875rem; margin: 0.5rem 0 0 0; opacity: 0.7;">18 specialized agents</p>
  </a>
  <a href="/docs/antigravity" style="padding: 1.5rem; background: var(--color-bg-tertiary); border-radius: 0.75rem; border: 1px solid var(--color-border); text-decoration: none; color: inherit;">
    <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">🌌</div>
    <strong>Antigravity IDE</strong>
    <p style="font-size: 0.875rem; margin: 0.5rem 0 0 0; opacity: 0.7;">IDE integration</p>
  </a>
</div>

---

**Need help?** Join our community or contact [hello@agencyos.network](mailto:hello@agencyos.network)

---

## 🏯 Binh Pháp Alignment

> **始計篇** (Thủy Kế) - Initial Assessment - Getting started

### Zero-Effort Commands

| Gõ lệnh | Auto-execute |
|---------|--------------|
| `/init` | Tự setup AgencyOS |
| `/plan` | Tự tạo plan |
| `/ship` | Tự deploy |

📖 [Xem tất cả Commands](/docs/commands)
