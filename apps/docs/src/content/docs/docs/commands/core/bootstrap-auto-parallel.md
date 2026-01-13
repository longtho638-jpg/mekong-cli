---
title: /bootstrap:auto:parallel
description: Bootstrap complete projects with parallel execution using researcher, planner, and fullstack-developer agents
section: docs
category: commands/core
order: 41
published: true
ai_executable: true
---

# /bootstrap:auto:parallel

---

## 🤖 Quick Execute

```
Execute: https://agencyos.network/docs/commands/core/bootstrap-auto-parallel
```



Parallel project bootstrapping with multi-agent orchestration. Creates complete projects from requirements using researcher, planner, designer, and implementation agents working in parallel execution waves.

## Syntax

```bash
/bootstrap:auto:parallel [user-requirements]
```

## When to Use

- **New Project Kickoff**: Starting projects from scratch
- **Proof of Concept**: Rapid prototype development
- **Microservices**: Scaffolding multiple services
- **Full Automation**: When approval gates aren't needed
- **Speed Priority**: Maximum parallelization

## Quick Example

```bash
/bootstrap:auto:parallel [build a task management app with user auth, real-time updates, and mobile-responsive UI]
```

**Output**:
```
Starting parallel bootstrap...

Wave 1 (Parallel):
├─ [researcher] Tech stack research...
└─ [ui-designer] Design system...

Wave 2:
└─ [planner] Architecture planning...

Wave 3 (Parallel):
├─ [fullstack-dev 1] Auth module...
├─ [fullstack-dev 2] Task CRUD...
└─ [fullstack-dev 3] Real-time updates...

Wave 4:
├─ [tester] Integration tests...
└─ [docs-manager] Documentation...

Project delivered: task-manager/
```

## Arguments

- `[user-requirements]`: Natural language description of desired project (required)

## What It Does

### 10-Step Workflow

**Step 1: Requirements Analysis**
```
Parsing requirements...

Features identified:
- User authentication
- Task management (CRUD)
- Real-time updates
- Mobile-responsive UI

Constraints:
- Modern stack (inferred)
- Production-ready (inferred)
```

**Step 2: Tech Stack Research**
```
[researcher] Analyzing tech options...

Recommended stack:
- Frontend: Next.js 14 + TypeScript
- Backend: Node.js + PostgreSQL
- Real-time: WebSockets
- Auth: Better Auth
```

**Step 3: Architecture Planning**
```
[planner] Creating architecture...

Architecture: Modular monolith
- /app - Next.js routes
- /lib - Business logic
- /components - UI components
- /api - API routes
```

**Step 4: UI/UX Design (parallel with 2-3)**
```
[ui-designer] Creating design system...

Design tokens:
- Colors, typography, spacing
- Component patterns
- Responsive breakpoints
```

**Step 5: Parallel Implementation Plan**
```
Creating /plan:parallel plan...

Phases identified:
- Phase 1: Auth (no deps)
- Phase 2: Task CRUD (no deps)
- Phase 3: Real-time (depends on 2)
- Phase 4: UI polish (depends on 1,2,3)
```

**Step 6: Phase Dependency Resolution**
```
Building execution waves...

Wave 1: Phase 1 + Phase 2 (parallel)
Wave 2: Phase 3 (sequential)
Wave 3: Phase 4 (sequential)
```

**Step 7: Parallel Execution**
```
Launching fullstack-developer agents...

[Agent 1] Phase 1: Auth module
[Agent 2] Phase 2: Task CRUD

Progress:
[██████████] Agent 1: Complete (8 min)
[████████──] Agent 2: 80% (9 min)
```

**Step 8: Integration Testing**
```
[tester] Running integration tests...

Tests: 24/24 passed
Coverage: 78%
```

**Step 9: Documentation**
```
[docs-manager] Generating docs...

Created:
- README.md
- API documentation
- Development guide
```

**Step 10: Project Delivery**
```
Project complete!
Location: task-manager/
```

## Parallel Execution Waves

```
Wave 1 (Parallel):
├── researcher: Tech stack research
└── ui-designer: Design system
                    │
                    ▼
Wave 2 (Sequential):
└── planner: Architecture planning
                    │
                    ▼
Wave 3 (Parallel):
├── fullstack-dev 1: Auth module
├── fullstack-dev 2: Task CRUD
└── fullstack-dev 3: Real-time
                    │
                    ▼
Wave 4 (Sequential):
├── tester: Integration tests
└── docs-manager: Documentation
```

## Agents Invoked

| Agent | Role | Wave |
|-------|------|------|
| researcher | Tech stack research | 1 |
| ui-designer | Design system | 1 |
| planner | Architecture planning | 2 |
| fullstack-developer (x3) | Parallel implementation | 3 |
| tester | Integration testing | 4 |
| docs-manager | Documentation | 4 |

## Output Structure

```
{project-name}/
├── src/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── styles/
├── tests/
│   ├── unit/
│   └── integration/
├── docs/
│   ├── api.md
│   └── development.md
├── plans/
│   └── bootstrap-YYMMDD/
│       ├── plan.md
│       ├── research-report.md
│       └── design-spec.md
├── README.md
├── package.json
└── tsconfig.json
```

## Complete Example

### Scenario: E-commerce Platform

```bash
/bootstrap:auto:parallel [build e-commerce platform with product catalog, shopping cart, checkout, and admin dashboard]
```

**Execution**:

```
═══════════════════════════════════════
        PARALLEL BOOTSTRAP
═══════════════════════════════════════

Requirements:
- Product catalog
- Shopping cart
- Checkout flow
- Admin dashboard

Wave 1: Research + Design (Parallel)
─────────────────────────────────────
[researcher] Tech stack analysis...
✓ Recommended: Next.js + Stripe + PostgreSQL

[ui-designer] Design system...
✓ E-commerce patterns: Product cards, cart, checkout

Wave 2: Architecture
─────────────────────────────────────
[planner] Creating architecture...
✓ Modular e-commerce structure
✓ 4 independent modules identified

Wave 3: Implementation (Parallel)
─────────────────────────────────────
[fullstack-dev 1] Product catalog...
[fullstack-dev 2] Shopping cart...
[fullstack-dev 3] Checkout + Stripe...
[fullstack-dev 4] Admin dashboard...

Progress:
[██████████] Agent 1: Complete (12 min)
[██████████] Agent 2: Complete (8 min)
[██████████] Agent 3: Complete (15 min)
[██████████] Agent 4: Complete (14 min)

Wave 4: Testing + Docs
─────────────────────────────────────
[tester] Integration tests...
✓ 42 tests passed

[docs-manager] Documentation...
✓ README, API docs, admin guide

═══════════════════════════════════════
        PROJECT COMPLETE
═══════════════════════════════════════

Location: ecommerce-platform/
Files: 87 files created
Tests: 42/42 passed
Coverage: 75%
Time: 18 minutes (vs ~45 min sequential)

Next steps:
1. cd ecommerce-platform
2. npm install
3. npm run dev
═══════════════════════════════════════
```

## Use Cases

### Full-Stack Application

```bash
/bootstrap:auto:parallel [SaaS dashboard with user management, billing, and analytics]
```

### Microservices Architecture

```bash
/bootstrap:auto:parallel [microservices: auth-service, user-service, notification-service with shared API gateway]
```

### API-First Project

```bash
/bootstrap:auto:parallel [REST API with OpenAPI spec, JWT auth, rate limiting, and PostgreSQL]
```

## Comparison

| Command | Approval | Parallelization | Speed |
|---------|----------|-----------------|-------|
| /bootstrap | Required | No | Slowest |
| /bootstrap:auto | No | No | Medium |
| /bootstrap:auto:parallel | No | Yes | Fastest |

## Best Practices

### Detailed Requirements

```bash
# Good: Specific requirements
/bootstrap:auto:parallel [
  Task management app with:
  - User auth (email + Google OAuth)
  - Project organization
  - Real-time collaboration
  - Mobile-responsive
  - Dark mode support
]

# Less effective: Vague
/bootstrap:auto:parallel [build a task app]
```

### Check Output Structure

After bootstrap:
```bash
cd {project-name}
ls -la
cat README.md
```

## Related Commands

- [/bootstrap](/docs/commands/core/bootstrap) - Bootstrap with approval gates
- [/bootstrap:auto](/docs/commands/core/bootstrap-auto) - Auto bootstrap (sequential)
- [/plan:parallel](/docs/commands/plan/parallel) - Create parallel plans
- [/code:parallel](/docs/commands/core/code-parallel) - Execute parallel plans

---

**Key Takeaway**: `/bootstrap:auto:parallel` creates complete projects using parallel agent execution waves, significantly reducing project setup time through coordinated multi-agent orchestration.
