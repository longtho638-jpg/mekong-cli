---
description: Quick project prime - structure and key files
---

// turbo

# /prime - Quick Context Prime

Fast project context loading for quick tasks.

## Usage

```
/prime
```

## Claude Prompt Template

```
Quick prime workflow:

1. View structure: tree -L 2 -I node_modules
2. Read key files:
   - README.md (first 100 lines)
   - CLAUDE.md or GEMINI.md
   - Main config file

3. Identify:
   - Project name
   - Main language
   - Entry point
   - Test command

Report summary.
```

## Example Output

```
⚡ Quick Prime: mekong-cli

📦 Type: Python monorepo
🚀 Entry: cli/main.py
🧪 Test: pytest tests/

Ready for work!
```
