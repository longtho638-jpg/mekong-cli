---
description: "Bootstrap venture studio — call mekong CLI engine. 1 command, ~15 min."
argument-hint: [studio-name]
allowed-tools: Bash
---

# /studio:bootstrap — Bootstrap Venture Studio

**Merged to Mekong CLI Engine** — delegates to `mekong studio init` + `mekong venture thesis`.

## Execution

```bash
# Parse arguments
STUDIO_NAME="$1"

# Call mekong CLI engine - chained commands
mekong studio init "$STUDIO_NAME" && mekong venture thesis update
```

## Output

Delegates to mekong CLI — see CLI output.
