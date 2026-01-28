---
description: 📜 PLAN - Strategic planning and task breakdown (Binh Pháp: Kế Hoạch)
argument-hint: [objective]
---

# /plan - Planner

> **"Thượng binh phạt mưu"** - The supreme art of war is to subdue the enemy without fighting (Winning by plan).

## Usage

```bash
/plan [action] [options]
```

## Actions/Options

| Action/Option | Description | Example |
|--------------|-------------|---------|
| `create` | Create new plan | `/plan create "Feature X"` |
| `update` | Update existing plan | `/plan update "Phase 2"` |
| `status` | Check plan status | `/plan status` |
| `--scaffold` | Create folder structure | `/plan create --scaffold` |

## Execution Protocol

1. **Agent**: Delegates to `planner`.
2. **Process**:
   - Research (via `/research`).
   - Break down into Phases (1-N).
   - Create `plans/{date}-{slug}/plan.md`.
3. **Output**: Detailed Implementation Plan.

## Examples

```bash
# Create a plan for a new module
/plan create "Implement Payment Gateway Integration"

# Check current plan status
/plan status
```

## Binh Pháp Mapping
- **Chapter 1**: Kế Hoạch (Planning) - Calculations before battle.

## Constitution Reference
- **Primary Workflow**: Planning is Step 0.

## Win-Win-Win
- **Owner**: Clarity & Roadmap.
- **Agency**: Scope control.
- **Client**: Predictable delivery.
