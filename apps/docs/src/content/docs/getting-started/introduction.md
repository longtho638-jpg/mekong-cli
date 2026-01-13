---
title: "Introduction"
description: "What is AgencyOS and how does it work? Learn the basics in 3 minutes"
section: getting-started
order: 1
published: true
ai_executable: true
---

# Introduction to AgencyOS

---

## 🤖 Quick Execute

```
Execute: https://agencyos.network/docs/getting-started/introduction
```



**AgencyOS** is an AI-powered operating system for solo agencies with specialized agents, slash commands, and reusable skills.

## Video Walkthrough

New to AgencyOS? Watch our step-by-step walkthrough covering CLI installation, setup with `mk` commands, and building your first feature.

<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 0.75rem; border: 1px solid var(--color-border); margin-bottom: 1rem; background: var(--color-bg-tertiary); display: flex; align-items: center; justify-content: center;">
  <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; padding: 2rem;">
    <div style="font-size: 3rem; margin-bottom: 1rem;">🏯</div>
    <h3 style="margin: 0 0 0.5rem 0; color: var(--color-text-primary);">Demo Video Coming Soon</h3>
    <p style="margin: 0; color: var(--color-text-muted);">Check our documentation to get started</p>
  </div>
</div>

## What is AgencyOS?

AgencyOS is a comprehensive AI-powered operating system for agencies, featuring **18 specialized agents**, **125+ commands**, and **5 business suites** that automate marketing, sales, finance, strategy, and operations.

**System Overview**:
- **18 Specialized Agents**: From planner to debugger, copywriter to revenue optimizer
- **125+ Commands**: Organized across 5 business suites for every agency need
- **5 Business Suites**: Marketing 🔥, Sales 💼, Finance 💰, Strategic 🏯, Operations ⚡
- **Interactive Patterns**: Each command guides you with 5-9 contextual questions
- **WIN³ Framework**: Aligned for Owner, Agency, and Client success

### 5 Business Suites

| Suite | Focus | Example Commands | Key Agents |
|-------|-------|------------------|------------|
| 🔥 **Marketing** | Growth & Content | `/ke-hoach-tiep-thi`, `/seo`, `/pr` | copywriter, scout |
| 💼 **Sales** | Revenue & CRM | `/khach-hang`, `/crm`, `/leadgen` | researcher, planner |
| 💰 **Finance** | Budget & Reporting | `/bao-cao-tai-chinh`, `/ngan-sach` | planner, analyst |
| 🏯 **Strategic** | Planning & Intel | `/binh-phap`, `/intel`, `/crisis` | planner, researcher |
| ⚡ **Operations** | Dev & Automation | `/cook`, `/fix:*`, `/test`, `/docs:*` | developer, tester, debugger |

**Core Components**:
- **Agents**: 18 specialized AI assistants working in orchestrated workflows
- **Commands**: 125+ slash commands organized by business function
- **Skills**: Reusable knowledge modules (Next.js, Better Auth, Docker, Supabase)

## Two Usage Modes

AgencyOS operates in two complementary modes:

| Mode | Entry Point | Focus |
|------|-------------|-------|
| **Mekong-CLI** | `python main.py` | Agency automation, deployment |
| **AgencyOS IDE** | Slash commands `/cook` | Software development |

**Mekong-CLI** (standalone Python CLI):
```bash
python main.py init my-agency
python main.py agents
python main.py deploy
```

**AgencyOS IDE** (requires IDE):
```
/cook add user authentication
/plan project roadmap
```

> **Note**: Slash commands like `/cook`, `/plan`, `/fix` require AgencyOS IDE IDE with AgencyOS installed.

## How It Works

1. **Invoke Command**: Type `/cook "add user authentication"`
2. **Interactive Questions**: System asks 5-9 contextual questions (auth provider? user roles? features?)
3. **Agent Orchestration**: Spawns 8-agent workflow:
   - `planner` → Creates implementation plan
   - `scout` → Analyzes existing codebase
   - `researcher` → Gathers best practices
   - `fullstack-developer` → Writes code
   - `tester` → Generates and runs tests
   - `code-reviewer` → Quality assurance
   - `docs-manager` → Updates documentation
   - `git-manager` → Commits with conventional format
4. **You Review**: Check output, provide feedback, iterate

## Why Use AgencyOS?

- **Speed**: 10x faster than manual prompting
- **Quality**: Battle-tested workflows reduce bugs and rework
- **Consistency**: Same approach across team members
- **Learning**: See how experts structure engineering tasks

## Quick Example

```bash
# Without AgencyOS
You: "I need to add authentication to my Next.js app"
Claude: "Sure! What auth library? What features?"
[20+ message back-and-forth]

# With AgencyOS
You: /cook "add authentication with Better Auth"
AgencyOS:
  ✓ Planner creates implementation plan
  ✓ Researcher analyzes codebase
  ✓ Developer writes code following best practices
  ✓ Tester runs tests and fixes issues
  ✓ Git commits changes
[Done in 1 command]
```

## Next Steps

1. **[Understand Concepts](/docs/getting-started/concepts)** - How agents, commands, and skills work
2. **[Install AgencyOS](/docs/getting-started/installation)** - Set up the CLI
3. **[Quick Start](/docs/getting-started/quick-start)** - Build your first feature in 15 minutes

## Want to Learn More?

- [Why AgencyOS](/docs/getting-started/why-mekong) - Comparisons, ROI calculations, pricing
- [Use Cases](/docs/workflows) - Real-world workflows
- [FAQ](/docs/support/faq) - Common questions answered

---

## 🏯 Binh Pháp Alignment

> **始計篇** (Thủy Kế) - Initial Assessment - Welcome to AgencyOS

### Zero-Effort Commands

| Gõ lệnh | Auto-execute |
|---------|--------------|
| `/init` | Tự setup AgencyOS |
| `/plan` | Tự tạo plan |
| `/ship` | Tự deploy |

📖 [Xem tất cả Commands](/docs/commands)
