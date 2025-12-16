# markdown-novel-viewer

Background HTTP server rendering markdown files with calm, book-like reading experience and plans dashboard.

## Purpose

Preview markdown plans, storyboards, and documentation in a warm novel-reader UI with:
- **Dashboard view** showing all plans with progress visualization
- Serif fonts and centered headings
- Dark/light theme toggle (persisted)
- Font size adjustment (S/M/L)
- Plan navigation sidebar for multi-phase plans
- Inline image rendering

## Quick Start

```bash
# Dashboard mode - view all plans in a directory
node $HOME/.claude/skills/markdown-novel-viewer/scripts/server.cjs \
  --dir ./plans \
  --host 0.0.0.0 \
  --open

# File mode - preview a single markdown file
node $HOME/.claude/skills/markdown-novel-viewer/scripts/server.cjs \
  --file ./plans/my-plan/plan.md \
  --open

# Background mode
node $HOME/.claude/skills/markdown-novel-viewer/scripts/server.cjs \
  --dir ./plans \
  --background

# Stop all running servers
node $HOME/.claude/skills/markdown-novel-viewer/scripts/server.cjs --stop
```

## Slash Command

Use `/preview` for quick access:

```bash
/preview plans/my-plan/plan.md    # Preview single plan
/preview plans/                   # Dashboard view
/preview --stop                   # Stop server
```

## Features

### Plans Dashboard
- **Statistics hero** with total, completed, in-progress, pending counts
- **Glassmorphism cards** with backdrop blur effects
- **Progress rings** showing completion percentage
- **Status badges** with animated indicators
- **Sorting**: by date, name, or progress
- **Filtering**: by status (all, completed, in-progress, pending)
- **Search**: filter plans by name
- **Keyboard navigation**: Arrow keys, Enter, Home/End
- **URL state persistence**: filters saved in URL params

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

### Dashboard Shortcuts
- `Arrow keys` - Navigate between cards
- `Enter/Space` - Open selected plan
- `Home/End` - Jump to first/last card

## CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `--dir <path>` | Plans directory (dashboard mode) | - |
| `--file <path>` | Markdown file or plan directory | - |
| `--port <number>` | Server port | 3456 |
| `--host <addr>` | Host to bind (`0.0.0.0` for remote) | localhost |
| `--open` | Auto-open browser | false |
| `--background` | Run in background | false |
| `--stop` | Stop all servers | - |

## Architecture

```
scripts/
├── server.cjs               # Main entry point
└── lib/
    ├── port-finder.cjs      # Dynamic port allocation
    ├── process-mgr.cjs      # PID file management
    ├── http-server.cjs      # Core HTTP routing (/view, /dashboard, /api)
    ├── markdown-renderer.cjs # MD→HTML conversion
    ├── plan-navigator.cjs   # Plan detection & nav
    ├── plan-scanner.cjs     # Recursive plan discovery
    └── dashboard-renderer.cjs # Dashboard HTML generation

assets/
├── template.html            # Markdown viewer template
├── novel-theme.css          # Combined light/dark theme
├── reader.js                # Client-side interactivity
├── dashboard-template.html  # Dashboard HTML template
├── dashboard.css            # Dashboard styles (glassmorphism)
└── dashboard.js             # Dashboard client-side logic
```

## HTTP Routes

| Route | Description |
|-------|-------------|
| `/dashboard` | Plans dashboard view |
| `/dashboard?dir=/path` | Dashboard for custom directory |
| `/api/dashboard` | JSON API for plans data |
| `/view/<path>` | Markdown file viewer |
| `/assets/*` | Static assets |
| `/file/*` | Local file serving (images) |

## Dependencies

- Node.js built-in: `http`, `fs`, `path`, `net`
- npm: `marked`, `highlight.js`, `gray-matter`

Install dependencies:
```bash
cd $HOME/.claude/skills/markdown-novel-viewer
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

### Dashboard Status Colors
```css
--status-completed: #22c55e;   /* Green */
--status-in-progress: #3b82f6; /* Blue */
--status-pending: #f59e0b;     /* Amber */
```

### Content Width
```css
--content-width: 720px;
```

## Plan Directory Structure

For automatic navigation and dashboard detection:
```
plans/
├── 251201-feature-a/
│   ├── plan.md              # Must contain phase table
│   ├── phase-01-setup.md
│   ├── phase-02-impl.md
│   └── phase-03-test.md
├── 251202-feature-b/
│   ├── plan.md
│   └── ...
└── reports/                  # Ignored in dashboard
```

Phase table format in `plan.md`:
```markdown
| Phase | Name | Status | Link |
|-------|------|--------|------|
| 1 | Setup | Completed | [phase-01-setup.md](./phase-01-setup.md) |
| 2 | Implementation | In Progress | [phase-02-impl.md](./phase-02-impl.md) |
```

## Remote Access

To access from another device on your network:

```bash
# Start with 0.0.0.0 to bind to all interfaces
node server.cjs --dir ./plans --host 0.0.0.0 --port 3456

# Access from another device
http://<server-ip>:3456/dashboard
```

## Troubleshooting

**Port in use**: Server auto-increments to next available port (3456-3500)

**Images not loading**: Ensure image paths are relative to markdown file

**Server won't stop**: Check `/tmp/md-novel-viewer-*.pid` for stale PID files

**Dashboard empty**: Ensure plan directories contain `plan.md` files

**Remote access denied**: Use `--host 0.0.0.0` to bind to all interfaces
