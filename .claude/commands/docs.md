---
description: 📚 DOCS - Documentation management (Binh Pháp: Đạo)
argument-hint: [docs task]
---

# /docs - Docs Manager

> **"Đạo là chỉ lòng người cùng theo một hướng"** - The Moral Law causes the people to be in complete accord with their ruler (Documentation aligns everyone).

## Usage

```bash
/docs [action] [options]
```

## Actions/Options

| Action/Option | Description | Example |
|--------------|-------------|---------|
| `generate` | Auto-generate docs | `/docs generate "API"` |
| `update` | Update existing docs | `/docs update "README"` |
| `check` | Check doc freshness | `/docs check` |
| `--type` | Specify format | `/docs generate --type markdown` |

## Execution Protocol

1. **Agent**: Delegates to `docs-manager`.
2. **Process**:
   - Scans code/changes.
   - Updates `docs/` folder content.
   - Ensures formatting (Markdown).
3. **Output**: Updated Documentation.

## Examples

```bash
# Update API documentation
/docs update "api-docs.md"

# Generate project summary
/docs generate "codebase-summary.md"
```

## Binh Pháp Mapping
- **Chapter 1**: Kế Hoạch (Planning/Calculations) - Shared understanding.

## Constitution Reference
- **Documentation Management**: Maintain `docs/` structure.

## Win-Win-Win
- **Owner**: Intellectual property.
- **Agency**: Knowledge transfer.
- **Client**: Self-service support.
