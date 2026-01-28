---
description: 💻 FULLSTACK - Implement features across the entire stack (Binh Pháp: Mưu Công)
argument-hint: [feature description]
---

# /fullstack - Fullstack Developer

> **"Thiện chiến giả, lập ư bất bại chi địa"** - The expert in battle positions himself beyond defeat.

## Usage

```bash
/fullstack [action] [options]
```

## Actions/Options

| Action/Option | Description | Example |
|--------------|-------------|---------|
| `implement` | Implement a full feature (FE + BE) | `/fullstack implement "User Auth"` |
| `debug` | Debug issues across the stack | `/fullstack debug "Login 500 Error"` |
| `scaffold` | Create structure for new feature | `/fullstack scaffold "Dashboard"` |
| `--framework` | Specify framework (nextjs/fastapi) | `/fullstack implement "Blog" --framework nextjs` |

## Execution Protocol

1. **Agent**: Delegates to `fullstack-developer`.
2. **Process**:
   - Analyzes requirements from Plan or Input.
   - Checks `plan.md` for context.
   - Implements Backend (API/DB) first.
   - Implements Frontend (UI/State) second.
   - Integrates and verifies.
3. **Output**: Fully implemented feature with verified code.

## Examples

```bash
# Implement a new feature
/fullstack implement "Add Dark Mode toggle with user preference persistence"

# Debug a fullstack issue
/fullstack debug "API returns data but Frontend shows empty state"
```

## Binh Pháp Mapping
- **Chapter 3**: Mưu Công (Win Without Fighting) - Integration prevents conflict.

## Constitution Reference
- **Development Rules**: VIBE Workflow (YAGNI, KISS, DRY).

## Win-Win-Win
- **Owner**: Feature delivered complete & working.
- **Agency**: Reduced integration overhead.
- **Client**: Seamless user experience.
