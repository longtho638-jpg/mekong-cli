---
title: "Core Concepts"
description: "Understand how AgencyOS's agents, commands, and skills architecture works"
section: getting-started
order: 2
published: true
ai_executable: true
---

# Core Concepts

---

## 🤖 Quick Execute

```
Execute: https://agencyos.network/docs/getting-started/concepts
```



AgencyOS's power comes from three interconnected systems: **Agents**, **Commands**, and **Skills**.

## Agents

Specialized AI assistants with focused expertise. AgencyOS features **18 agents** organized by function:

### Strategic Agents
- **Planner**: Creates implementation plans with phases, tasks, success criteria
- **Researcher**: Analyzes codebases, best practices, technical decisions
- **Brainstormer**: Generates creative solutions and alternative approaches
- **Project Manager**: Tracks tasks, timelines, and project health
- **Scout (External)**: Gathers market intelligence and competitive analysis

### Operations Agents
- **Fullstack Developer**: Writes production-ready code following best practices
- **Tester**: Writes and runs tests, analyzes failures, fixes issues
- **Debugger**: Investigates bugs, traces root causes, proposes fixes
- **Code Reviewer**: Reviews code quality, security, performance
- **Git Manager**: Handles version control with conventional commits
- **Scout (Internal)**: Analyzes codebase structure and dependencies

### Content & Design Agents
- **Docs Manager**: Creates and maintains technical documentation
- **UI/UX Designer**: Designs interfaces following aesthetic principles
- **Copywriter**: Writes marketing copy, product descriptions, content
- **Journal Writer**: Documents project progress and decisions

### Specialized Agents
- **Database Admin**: Manages schema, migrations, and database operations
- **MCP Manager**: Integrates and manages Model Context Protocol tools

**Agent Orchestration**:
1. You invoke a command (e.g., `/cook "add feature"`)
2. Command spawns 5-10 agents in coordinated workflow
3. Agents collaborate via shared context (plans, code, test results)
4. Each agent adds its expertise to the pipeline
5. Output consolidated and presented to you

## Commands

Slash commands that trigger agent workflows. AgencyOS features **125+ commands** organized across **5 Business Suites**:

### 🔥 Marketing Suite (~25 commands)
Growth, content, and brand operations:
- **Strategy**: `/ke-hoach-tiep-thi`, `/marketing-strategy`, `/content-marketing`
- **Channels**: `/seo`, `/ppc`, `/email`, `/social`, `/influencer`, `/pr`
- **Content**: `/content:good`, `/content:fast`, `/content:cro`, `/content:enhance`
- **Analytics**: `/campaigns`, `/analytics`, `/ab-test`

### 💼 Sales Suite (~20 commands)
Revenue generation and customer management:
- **Pipeline**: `/chien-luoc-ban-hang`, `/sales`, `/crm`, `/leadgen`
- **Personas**: `/khach-hang`, `/customer-profile`, `/buyer-persona`
- **Tools**: `/tao-bao-gia`, `/pricing`, `/sdr`, `/ae`, `/bdm`, `/abm`

### 💰 Finance Suite (~15 commands)
Budget management and reporting:
- **Core**: `/bao-cao-tai-chinh`, `/ngan-sach`, `/finance`
- **Operations**: `/hoa-don`, `/invoice`, `/expense`, `/runway`
- **Analysis**: `/theo-doi-chi-phi`, `/cost-tracking`, `/budget-plan`

### 🏯 Strategic Suite (~20 commands)
High-level planning and intelligence:
- **Planning**: `/ke-hoach-kinh-doanh`, `/business-plan`, `/growth-strategy`
- **Framework**: `/binh-phap` (13 chapters), `/intel`, `/competitive-analysis`
- **Crisis**: `/crisis`, `/risk-assessment`, `/pivot-strategy`

### ⚡ Operations Suite (~45 commands)
Development and technical automation:
- **Development**: `/cook`, `/code`, `/bootstrap`, `/plan`
- **Testing**: `/test`, `/fix`, `/fix:fast`, `/fix:hard`, `/fix:test`, `/fix:types`, `/fix:ui`, `/fix:ci`
- **Design**: `/design:good`, `/design:fast`, `/design:3d`, `/design:video`, `/design:screenshot`
- **Documentation**: `/docs:init`, `/docs:update`, `/docs:summarize`
- **Version Control**: `/git:cm`, `/git:commit`, `/git:commit-push`, `/git:pr`
- **Integration**: `/integrate:polar`, `/integrate:sepay`, `/mcp:*`

**Interactive Patterns**:
Each command guides you with **5-9 contextual questions** before execution:
```bash
You: /ke-hoach-kinh-doanh

System:
1. Tên dự án? | Project name?
2. Vấn đề giải quyết? | Problem solving?
3. Khách hàng mục tiêu? | Target customer?
4. Địa bàn hoạt động? | Location/Market?
5. Mô hình doanh thu? | Revenue model?
6. Lợi thế cạnh tranh? | Competitive advantage?
7. Vốn khởi điểm? | Startup capital?
8. Mục tiêu 12 tháng? | 12-month goal?
9. Team hiện tại? | Current team?

[Generates comprehensive business plan]
```

**Example Workflow**:
```bash
/plan "add payment processing with Stripe"
# → Planner creates detailed plan (asks 6 questions)

/cook
# → Reads plan, spawns 8-agent workflow, implements feature

/test
# → Tester runs test suite, reports coverage

/fix:test
# → Debugger analyzes failures, fixes issues

/git:cm
# → Git manager commits with conventional format
```

## Skills

Reusable knowledge modules injected into agent context.

**Available Skills**:
- **Frontend**: Next.js, Tailwind, shadcn/ui
- **Backend**: PostgreSQL, Docker
- **AI**: Gemini Vision, Canvas Design
- **Auth**: Better Auth
- **Ecommerce**: Shopify
- **Tools**: FFmpeg, ImageMagick, MCP Builder

**How Skills Work**:
1. Skill files stored in `.agencyos/skills/`
2. Auto-activated based on codebase detection (e.g., detects `next.config.js` → activates Next.js skill)
3. Skill provides agent with best practices, examples, gotchas
4. Agent makes better decisions (uses right patterns, avoids common mistakes)

**Creating Custom Skills**:
```bash
/skill:create "FastAPI best practices"
# → Creates new skill with structure, references, examples
```

## How They Work Together

**Example: Adding Authentication**

```bash
You: /cook "add authentication with Better Auth"

System:
1. Detects Better Auth skill → injects into context
2. Spawns Planner agent → creates implementation plan
3. Planner references Better Auth skill → uses correct setup pattern
4. Spawns Developer agent → writes code following skill guidelines
5. Spawns Tester agent → writes tests based on skill examples
6. Output: Fully implemented, tested authentication
```

## AGENCYOS.md Configuration

All agent behaviors, skills, and workflows configured in `.agencyos/AGENCYOS.md`:

```markdown
# AGENCYOS.md
## Agents
- planner: Creates implementation plans
- researcher: Analyzes technical decisions

## Skills
- better-auth: Authentication framework patterns
- nextjs: Next.js App Router best practices

## Workflows
- /plan → /code: Plan → Implement existing plan
- /fix: Debug → Fix → Test → Commit
```

## Next Steps

- **[Installation](/docs/getting-started/installation)** - Install AgencyOS
- **[Quick Start](/docs/getting-started/quick-start)** - Try your first command
- **[Commands Reference](/docs/commands)** - Explore all commands
- **[Agents Reference](/docs/agents)** - Learn about each agent

---

## 🏯 Binh Pháp Alignment

> **計篇** (Kế) - Strategic calculations - Core concepts

### Zero-Effort Commands

| Gõ lệnh | Auto-execute |
|---------|--------------|
| `/init` | Tự setup AgencyOS |
| `/plan` | Tự tạo plan |
| `/ship` | Tự deploy |

📖 [Xem tất cả Commands](/docs/commands)
