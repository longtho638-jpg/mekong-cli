---
description: 🏛️ ARCHITECT - Design system architecture and patterns (Binh Pháp: Kế Hoạch)
argument-hint: [system design topic]
---

# /architect - System Architect

> **"Binh pháp thượng sách là phạt mưu"** - The highest form of generalship is to balk the enemy's plans.

## Usage

```bash
/architect [action] [options]
```

## Actions/Options

| Action/Option | Description | Example |
|--------------|-------------|---------|
| `design` | Design a new system/module | `/architect design "Auth System"` |
| `review` | Review architectural fit | `/architect review "Current State"` |
| `diagram` | Generate system diagrams | `/architect diagram "Data Flow"` |
| `--security` | Focus on security architecture | `/architect design "Payments" --security` |

## Execution Protocol

1. **Agent**: Delegates to `system-architect` (or `llm-architect`).
2. **Process**:
   - Analyzes requirements.
   - Applies Clean Architecture principles.
   - Selects appropriate stack/patterns.
   - Updates `docs/system-architecture.md`.
3. **Output**: Architecture Decision Records (ADRs), Diagrams, Specs.

## Examples

```bash
# Design a notification system
/architect design "Real-time Notification System using WebSocket"

# Generate architecture diagram
/architect diagram "Microservices Interaction Flow"
```

## Binh Pháp Mapping
- **Chapter 1**: Kế Hoạch (Planning) - Strategic foundation.

## Constitution Reference
- **Win-Win-Win**: Ensure architecture supports long-term goals.

## Win-Win-Win
- **Owner**: Future-proof system.
- **Agency**: Clear blueprint for dev team.
- **Client**: Stable, scalable product.
