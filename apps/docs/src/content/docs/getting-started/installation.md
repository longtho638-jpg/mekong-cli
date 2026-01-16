---
title: Installation
description: Install AgencyOS and Vibe Kanban.
section: getting-started
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

AgencyOS requires a minimal setup to enable the full "Antigravity" experience.

## System Requirements

*   **OS:** macOS, Linux, or Windows (WSL2 recommended).
*   **Python:** 3.9+.
*   **Node.js:** 18+ (for Vibe Kanban).

## Automatic Setup (Recommended)

We provide a script to set up everything (CLI + Kanban Board) in one go.

```bash
# 1. Clone the repository
git clone https://github.com/longtho638-jpg/mekong-cli.git
cd mekong-cli

# 2. Run the setup script
chmod +x scripts/setup_vibe_kanban.sh
./scripts/setup_vibe_kanban.sh
```

This script will:
1.  Clone the `vibe-kanban` repository.
2.  Install Node.js dependencies.
3.  Configure the `.env` file for local development.

## Manual Setup

If you prefer to set up manually:

### 1. Core CLI

```bash
pip install -r requirements.txt
```

### 2. Vibe Kanban (Optional but Recommended)

AgencyOS uses [Vibe Kanban](https://github.com/BloopAI/vibe-kanban) for task orchestration.

```bash
git clone https://github.com/BloopAI/vibe-kanban.git external/vibe-kanban
cd external/vibe-kanban
npm install
npm run dev
```

Then update your `.env` in `mekong-cli`:
```bash
VIBE_KANBAN_URL=http://localhost:3000
VIBE_KANBAN_TOKEN=default_token
```

## Verification

Run the guide command to verify everything is working:

```bash
python3 cli/main.py guide
```

If you see the **VIBE CODING MANUAL**, you are ready to go! 🚀