# Binh Pháp x Agent Architecture Map

This document maps the **Gumroad Product Suite** to the **AgencyOS Agent Architecture** (`.claude`), ensuring every sales asset corresponds to a tangible technical component.

## 🏯 The 3-Layer Strategy

| Layer         | Binh Pháp Concept       | Technical Component | Purpose                     |
| ------------- | ----------------------- | ------------------- | --------------------------- |
| **1. Brain**  | **Mưu Công** (Strategy) | `.claude/brain/`    | Context, Memory, & Planning |
| **2. Arms**   | **Thần Tốc** (Speed)    | `.claude/commands/` | Automation & Execution      |
| **3. Shield** | **Pháp Chế** (Law)      | `.claude/hooks/`    | Protection & Standards      |

## 🗺️ Product-to-Code Mapping

### 1. VIBE Coding Starter Kit

- **Role**: The Execution Engine
- **Binh Pháp**: "Đừng code, hãy điều binh." (Command, don't code.)
- **Code Map**:
    - `/.claude/commands/*.md` (Slash Commands)
    - `/.claude/config.json` (Agent Configuration)
    - `/.vscode/settings.json` (Terminal Integration)

### 2. AI Skills Pack

- **Role**: The Specialist Intelligence
- **Binh Pháp**: "Quân Sư đa tài." (Versatile Strategist.)
- **Code Map**:
    - `/.claude/skills/ai/*.md` (Multimodal, Reasoning)
    - `/.claude/skills/backend/*.md` (API Design)
    - `/.claude/mcp/*.json` (Tool Definitions)

### 3. AgencyOS Pro

- **Role**: The Central Nervous System
- **Binh Pháp**: "Vận hành như Đế chế." (Empire Operation.)
- **Code Map**:
    - `/.claude/memory/` (Project Context)
    - `/.claude/workflows/` (Standard Operating Procedures)
    - `task.md` (The Living Plan)

### 4. Vietnamese Agency Kit

- **Role**: The Shield & Governance
- **Binh Pháp**: "Pháp chế nghiêm minh." (Strict Laws.)
- **Code Map**:
    - `/docs/contracts/` (Legal Framework)
    - `/.claude/hooks/pre-commit` (Quality Gates)
    - `/revenue/calc.py` (Financial Formulas)

## 🔄 Synchronization Protocol

To ensure this map remains true ("Thực chiến"), every update to the codebase must be reflected in the product positioning:

1.  **New Command added** -> Update **VIBE Starter** description.
2.  **New Skill added** -> Update **AI Skills Pack** tags.
3.  **New Workflow added** -> Update **AgencyOS Pro** features.

> **"Code is Strategy. Strategy is Code."**
