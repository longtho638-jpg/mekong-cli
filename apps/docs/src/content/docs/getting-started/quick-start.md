---
title: Quick Start
description: Start Vibe Coding in 5 minutes with AgencyOS.
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

Ready to experience **Vibe Coding**? This guide will take you from "Zero" to "Architect" in under 5 minutes.

## Prerequisites

*   **Terminal:** Any terminal (iTerm2, PowerShell, VSCode Terminal).
*   **AI Editor:** Recommended: [Cursor](https://cursor.sh/), [Windsurf](https://codeium.com/windsurf), or just Claude.ai.
*   **Git:** Installed on your machine.

## Step 1: Install AgencyOS

Clone the repository and set up the environment.

```bash
# 1. Clone the repo
git clone https://github.com/longtho638-jpg/mekong-cli.git agency-os
cd agency-os

# 2. Install dependencies (Automated)
./scripts/setup_vibe_kanban.sh

# 3. Verify installation
python3 cli/main.py --help
```

> **Tip:** You can alias `python3 cli/main.py` to `agencyos` in your shell for faster access.

## Step 2: The "Vibe Coding" Workflow

Now, let's build something real. Imagine you want to build a **Task Management SaaS**.

### 1. 🏗️ Create the Blueprint (Scaffold)

Instead of writing code from scratch, let the **Architect Agent** design it for you.

```bash
python3 cli/main.py scaffold "I want to build a Task Management SaaS with subscription billing"
```

**Output:**
You will see a "Blueprint" containing:
*   **Architecture:** Clean Architecture (Recommended).
*   **Structure:** `src/core`, `src/infra`, `src/app`.
*   **System Prompt:** A text block between `✂️ COPY BELOW THIS LINE ✂️`.

### 2. 🤖 Feed the AI (Code)

1.  **Copy** the System Prompt generated in the previous step.
2.  **Open** your AI Editor (Cursor/Claude).
3.  **Paste** the prompt and hit Enter.

*Watch as the AI generates the folder structure and core files exactly as designed.*

### 3. 📋 Manage the Work (Kanban)

Don't let the AI wander. Assign specific tasks.

```bash
# Initialize the board
python3 cli/main.py kanban create "Setup Authentication Module" --agent fullstack-dev --priority P1

# Check the board
python3 cli/main.py kanban board
```

### 4. 🚀 Ship It

When you are ready to deploy:

```bash
python3 cli/main.py ship
```

## Available Commands

| Command | Description |
| :--- | :--- |
| `scaffold` | Generate Architecture Blueprint & AI Prompts |
| `kanban` | Manage tasks and agents on the board |
| `guide` | Show the built-in Vibe Coding Manual |
| `binh-phap` | Analyze project strategy |
| `ship` | Deploy to production |

## What's Next?

*   📖 **[Architecture Guide](/docs/architecture/top-tier-repos)**: Deep dive into the patterns.
*   🧘 **[Vibe Manual](/docs/getting-started/introduction)**: Master the mindset.

---

**Congratulations!** You are now an AgencyOS Architect. 🏯