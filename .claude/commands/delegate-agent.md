---
description: 🤝 DELEGATE-AGENT - Delegate with Binh Pháp strategy
---

# /delegate-agent - Role-Based Delegation + Binh Pháp

> **"Giao việc đúng người + Đúng chiến lược"** - ĐIỀU 40

## 🔴 MANDATORY: Every Delegation MUST Include Binh Pháp Chapter

## Usage

```bash
/delegate-agent [role] "[task]" --binh-phap=[chapter]
```

## Binh Pháp → Task Type Mapping

| Task Type    | Binh Pháp Chapter | Vietnamese | Use When               |
| ------------ | ----------------- | ---------- | ---------------------- |
| Planning     | Ch.1 始計         | Kế Hoạch   | Roadmap, PRD, strategy |
| Resources    | Ch.2 作戰         | Tác Chiến  | Budget, allocation     |
| Efficiency   | Ch.3 謀攻         | Mưu Công   | Automation, shortcuts  |
| Structure    | Ch.4 形勢         | Hình Thế   | Architecture, design   |
| Momentum     | Ch.5 勢           | Thế Trận   | Growth, scaling        |
| Testing      | Ch.6 虛實         | Hư Thực    | QA, security audit     |
| Speed        | Ch.7 軍爭         | Quân Tranh | Hotfix, urgent deploy  |
| Flexibility  | Ch.8 九變         | Cửu Biến   | Refactor, adapt        |
| Execution    | Ch.9 行軍         | Hành Quân  | Build, implement       |
| Analysis     | Ch.10 地形        | Địa Hình   | Metrics, performance   |
| Context      | Ch.11 九地        | Cửu Địa    | Sequential, phased     |
| Disruption   | Ch.12 火攻        | Hỏa Công   | Launch, deploy prod    |
| Intelligence | Ch.13 用間        | Dụng Gián  | Research, monitoring   |

## Roles → Default Binh Pháp

| Role    | Agent                 | Default Chapter |
| ------- | --------------------- | --------------- |
| `cto`   | `system-architect`    | Ch.4 Hình Thế   |
| `cmo`   | `marketing-hub`       | Ch.12 Hỏa Công  |
| `cfo`   | `revenue-engine`      | Ch.2 Tác Chiến  |
| `coo`   | `adminops`            | Ch.9 Hành Quân  |
| `legal` | `legal-hub`           | Ch.6 Hư Thực    |
| `qa`    | `quality-engineer`    | Ch.6 Hư Thực    |
| `dev`   | `fullstack-developer` | Ch.9 Hành Quân  |

## Execution Template (MANDATORY FORMAT)

```bash
/delegate "MISSION: [Task Name]

[Task Description]

Binh Pháp: Ch.[N] [Chinese] [Vietnamese] → [Application]

Output: [Expected Results]
Commit: All changes after completion"
```

## Examples

```bash
# ✅ CORRECT - With Binh Pháp
/delegate "Fix PayPal types in apps/landing/

Binh Pháp: Ch.9 行軍 Hành Quân → Steady execution

Output: Zero :any types
Commit: After typecheck passes"

# ✅ CORRECT - Security audit
/delegate-agent qa "Audit payment module"
# Implicit: Ch.6 虛實 Hư Thực (Testing)

# ❌ WRONG - No Binh Pháp reference
/delegate "Fix the bugs"
```

## Win-Win-Win

- **Owner**: Strategic alignment with ancient wisdom.
- **Agency**: Clear tactical framework.
- **Client**: Proven methodology, reliable results.
