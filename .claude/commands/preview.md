---
description: Preview markdown files in novel-reader UI
arguments:
  - name: file
    description: Path to markdown file or plan directory
    required: false
---

Preview markdown file in novel-reader UI with warm book-like aesthetic.

## Usage

- `/preview <file.md>` - Preview single markdown file
- `/preview <plan-dir>/` - Preview plan with navigation
- `/preview --stop` - Stop running server

## Execution

Run the markdown-novel-viewer server:

```bash
# Check if --stop flag
if [[ "$ARGUMENTS" == *"--stop"* ]]; then
  node .claude/skills/markdown-novel-viewer/scripts/server.cjs --stop
  exit 0
fi

# Start server with file
node .claude/skills/markdown-novel-viewer/scripts/server.cjs \
  --file "{{file}}" \
  --open \
  --background
```

Report the URL to the user.
