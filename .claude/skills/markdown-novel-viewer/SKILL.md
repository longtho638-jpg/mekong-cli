# markdown-novel-viewer

Background HTTP server rendering markdown files with calm, book-like reading experience.

## Purpose

Preview markdown plans, storyboards, and documentation in a warm novel-reader UI with:
- Serif fonts and centered headings
- Dark/light theme toggle (persisted)
- Font size adjustment (S/M/L)
- Plan navigation sidebar for multi-phase plans
- Inline image rendering

## Quick Start

```bash
# Preview a markdown file
node .claude/skills/markdown-novel-viewer/scripts/server.cjs \
  --file ./plans/my-plan/plan.md \
  --open

# Preview in background
node .claude/skills/markdown-novel-viewer/scripts/server.cjs \
  --file ./docs/readme.md \
  --open \
  --background

# Stop all running servers
node .claude/skills/markdown-novel-viewer/scripts/server.cjs --stop
```

## Slash Command

Use `/preview` for quick access:

```bash
/preview plans/my-plan/plan.md    # Preview plan
/preview docs/readme.md           # Preview doc
/preview --stop                   # Stop server
```

## Features

### Novel Theme
- Warm cream background (light mode)
- Dark mode with warm gold accents
- Libre Baskerville serif headings
- Inter body text, JetBrains Mono code
- Maximum 720px content width

### Plan Navigation
- Auto-detects plan directory structure
- Sidebar shows all phases with status indicators
- Previous/Next navigation buttons
- Keyboard shortcuts: Arrow Left/Right

### Keyboard Shortcuts
- `T` - Toggle theme
- `S` - Toggle sidebar
- `Left/Right` - Navigate phases
- `Escape` - Close sidebar (mobile)

## CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `--file <path>` | Markdown file or directory | Required |
| `--port <number>` | Server port | 3456 |
| `--open` | Auto-open browser | false |
| `--background` | Run in background | false |
| `--stop` | Stop all servers | - |

## Architecture

```
scripts/
├── server.cjs              # Main entry point
└── lib/
    ├── port-finder.cjs     # Dynamic port allocation
    ├── process-mgr.cjs     # PID file management
    ├── http-server.cjs     # Core HTTP routing
    ├── markdown-renderer.cjs # MD→HTML conversion
    └── plan-navigator.cjs  # Plan detection & nav

assets/
├── template.html           # HTML template
├── novel-theme.css         # Combined light/dark styles
└── reader.js               # Client-side interactivity
```

## Dependencies

- Node.js built-in: `http`, `fs`, `path`, `net`
- npm: `marked`, `highlight.js`, `gray-matter`

Install dependencies:
```bash
cd .claude/skills/markdown-novel-viewer
npm install marked highlight.js gray-matter
```

## Customization

### Theme Colors (CSS Variables)

Light mode variables in `assets/novel-theme.css`:
```css
--bg-primary: #faf8f3;      /* Warm cream */
--accent: #8b4513;          /* Saddle brown */
```

Dark mode:
```css
--bg-primary: #1a1a1a;      /* Near black */
--accent: #d4a574;          /* Warm gold */
```

### Content Width
```css
--content-width: 720px;
```

## Plan Directory Structure

For automatic navigation detection:
```
plans/my-plan/
├── plan.md              # Must contain phase table
├── phase-01-setup.md
├── phase-02-impl.md
└── phase-03-test.md
```

Phase table format in `plan.md`:
```markdown
| Phase | Name | Status | Link |
|-------|------|--------|------|
| 1 | Setup | Completed | [phase-01-setup.md](./phase-01-setup.md) |
```

## Troubleshooting

**Port in use**: Server auto-increments to next available port (3456-3500)

**Images not loading**: Ensure image paths are relative to markdown file

**Server won't stop**: Check `/tmp/md-novel-viewer-*.pid` for stale PID files
