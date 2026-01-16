# 🏯 Unified Agent Architecture

> **Version**: v3.1.0-vibe-coding | **Date**: 2026-01-16
> **ClaudeKit-Engineer** + **Antigravity IDE** Unified Framework

---

## 📁 Directory Structure

```
mekong-cli/
├── .claude/                    # ClaudeKit-Engineer (for Claude Code)
│   ├── agents/                 # 22 persona-based agents
│   ├── commands/               # 11 slash commands
│   ├── hooks/                  # Session & privacy hooks
│   ├── skills/                 # 39+ deep skill modules
│   └── settings.json           # Claude-specific config
│
├── .agent/                     # Antigravity IDE (for Gemini)
│   ├── subagents/              # 106 task-based subagents
│   │   ├── core/               # WIN3, orchestration (5)
│   │   ├── hubs/               # Department hubs (18)
│   │   ├── ops/                # Operations agents (34)
│   │   └── mekongAgent/        # Community imports (42)
│   ├── workflows/              # 29 agentic workflows
│   ├── skills/                 # Quick skills (6 categories)
│   └── crews/                  # Multi-agent crews
│
└── GEMINI.md                   # Shared memory (both read)
```

---

## 🔗 Synced Components

| Component       | Claude                                   | Gemini                                   | Status    |
| --------------- | ---------------------------------------- | ---------------------------------------- | --------- |
| **Binh Pháp**   | `.claude/agents/binh-phap-strategist.md` | `.agent/subagents/hubs/binh-phap-hub.md` | ✅ SYNCED |
| **WIN-WIN-WIN** | `GEMINI.md`                              | `GEMINI.md`                              | ✅ SHARED |
| **Data Diet**   | `GEMINI.md`                              | `GEMINI.md`                              | ✅ SHARED |

---

## 🎯 Command Mapping

| Action      | Claude Command | Gemini Workflow        |
| ----------- | -------------- | ---------------------- |
| Development | `/cook`        | `/agencyos-unified`    |
| Planning    | `/plan`        | `/feature-development` |
| Testing     | `/test`        | `/bug-fixing`          |
| Research    | `/scout`       | `/mvp-launch`          |
| Cloudflare  | `/cloudflare`  | `/cf-easy`             |

---

## 🧠 Skills Mapping

| Domain       | `.claude/skills/`      | `.agent/skills/` |
| ------------ | ---------------------- | ---------------- |
| AI           | `ai-multimodal/`       | `ai/`            |
| Backend      | `backend-development/` | `backend/`       |
| Frontend     | `frontend-design/`     | `frontend/`      |
| Integrations | `payment-integration/` | `integrations/`  |
| Tools        | `mcp-builder/`         | `tools/`         |

---

## 📊 Statistics

| Metric    | Claude | Gemini       | Total |
| --------- | ------ | ------------ | ----- |
| Agents    | 22     | 106          | 128   |
| Skills    | 39     | 6 categories | 45+   |
| Workflows | 11     | 29           | 40    |
| Hooks     | 6      | —            | 6     |

---

## 🏯 Core Wisdom

> **"Bất chiến nhi khuất nhân chi binh"**
> Win without fighting - the highest form of victory.

Both IDEs share the Binh Pháp philosophy:

- **WIN-WIN-WIN** validation before every action
- **Ngũ Sự** assessment for major decisions
- **13 Chapters** framework for strategic guidance

---

_Unified Architecture by AgencyOS | Synced on January 16, 2026_
