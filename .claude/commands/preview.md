---
description: Preview markdown files or plans dashboard in novel-reader UI
arguments:
  - name: path
    description: Path to markdown file, plan directory, or plans collection
    required: false
---

Preview markdown files or plans dashboard in novel-reader UI with warm book-like aesthetic.

## Usage

- `/preview <file.md>` - Preview single markdown file
- `/preview <plan-dir>/` - Preview plan with navigation sidebar
- `/preview plans/` - Dashboard view of all plans
- `/preview --stop` - Stop running server

## Execution

Run the markdown-novel-viewer server:

```bash
# Check if --stop flag
if [[ "$ARGUMENTS" == *"--stop"* ]]; then
  node .claude/skills/markdown-novel-viewer/scripts/server.cjs --stop
  exit 0
fi

# Determine mode: --dir for directories, --file for markdown files
INPUT_PATH="{{path}}"
if [[ -d "$INPUT_PATH" ]]; then
  # Directory mode - dashboard or plan navigation
  node .claude/skills/markdown-novel-viewer/scripts/server.cjs \
    --dir "$INPUT_PATH" \
    --host 0.0.0.0 \
    --open \
    --background
else
  # File mode - single markdown viewer
  node .claude/skills/markdown-novel-viewer/scripts/server.cjs \
    --file "$INPUT_PATH" \
    --host 0.0.0.0 \
    --open \
    --background
fi
```

Report the URL to the user. For remote access, use the server's IP address instead of localhost.
