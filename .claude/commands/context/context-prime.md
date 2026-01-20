---
description: Prime Claude with comprehensive project understanding
---

// turbo

# /context-prime - Project Context Loader

Load full project context for better Claude understanding.

## Usage

```
/context-prime
```

## Claude Prompt Template

```
Context priming workflow:

1. **🏰 Load Binh Pháp Constitution:**
   - Read `@[.claude]/CLAUDE.md` (Mandatory Rules)
   - Read `@[.claude]/GEMINI.md` (Strategy)

2. **🌉 Load Bridge Mappings:**
   - Read `@[claude_bridge]/command_mappings.json`
   - Understand available `agencyos` workflows

3. **🧠 Load Skill Index:**
   - Read `@[.claude]/docs/SKILL_INDEX.md`
   - Map capabilities to current task

4. **Load Project Structure:**
   - Read directory tree (max 3 levels)
   - Identify key keys (package.json, pyproject.toml)

5. **Establish Session:**
   - Apply "Win-Win-Win" mindset
   - Set output style to "Antigravity Premium"

Report context loaded with a summary of available Agents and Skills.
```

## Example Output

```
🧠 Context Prime: mekong-cli

📁 Project Type: Python + Node monorepo
📦 Key Deps: FastAPI, React, Turbo

📂 Structure Loaded:
   - 45 Python modules
   - 23 React components
   - 168 test files

📋 Standards Detected:
   - Ruff for Python linting
   - ESLint for TypeScript
   - Conventional commits

✅ Context loaded! Claude is ready.
```
