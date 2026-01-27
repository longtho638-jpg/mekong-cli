---
description: description: Scaffold a new project structure using Antigravity Architect
---

# Claudekit Command: /scaffold

> Imported from claudekit-engineer

# /scaffold

Analyses your requirements and generates a robust architectural blueprint using the Antigravity Architect engine.

## Usage

```bash
/scaffold "A simple todo app"
/scaffold "Enterprise fintech trading platform with audit logs"
```

## How it works

1.  **Analyzes** your request using `ArchitectService`.
2.  **Determines** complexity (Simple, Clean, or Hexagonal/DDD).
3.  **Generates** a blueprint with folder structure and rules.
4.  **Provides** a system prompt you can use for implementation.

## Execution

<CLAUDE_EXECUTION>
# Extract arguments
REQUEST="$1"
shift
EXTRA_ARGS="$@"

if [ -z "$REQUEST" ]; then
  echo "❌ Error: Please provide a project description."
  echo "Usage: /scaffold \"Description\""
  exit 1
fi

# Run the python script
python3 scripts/scaffold_project.py "$REQUEST" $EXTRA_ARGS
</CLAUDE_EXECUTION>
