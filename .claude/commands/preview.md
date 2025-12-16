---
description: Path to markdown file, plan directory, or plans collection
arguments:
  - name: path
    description: Path to file or directory to preview
    required: false
---

Universal viewer - pass ANY path and see it rendered nicely.

## Usage

- `/preview <file.md>` - View markdown file in novel-reader UI
- `/preview <directory/>` - Browse directory contents
- `/preview --stop` - Stop running server

## Examples

```bash
/preview plans/my-plan/plan.md     # View markdown file
/preview plans/                    # Browse plans directory
/preview docs/                     # Browse docs directory
/preview any/path/to/file.md      # View any markdown file
/preview any/path/                 # Browse any directory
```

## Execution

Run the markdown-novel-viewer server:

```bash
# Check if --stop flag
if [[ "$ARGUMENTS" == *"--stop"* ]]; then
  node .claude/skills/markdown-novel-viewer/scripts/server.cjs --stop
  exit 0
fi

# Determine if path is file or directory
INPUT_PATH="{{path}}"
if [[ -d "$INPUT_PATH" ]]; then
  # Directory mode - browse
  node .claude/skills/markdown-novel-viewer/scripts/server.cjs \
    --dir "$INPUT_PATH" \
    --host 0.0.0.0 \
    --open \
    --background
else
  # File mode - view markdown
  node .claude/skills/markdown-novel-viewer/scripts/server.cjs \
    --file "$INPUT_PATH" \
    --host 0.0.0.0 \
    --open \
    --background
fi
```

Report the URL to the user. For remote access from other devices, use the `networkUrl` field from the JSON output (auto-detected local IP).
