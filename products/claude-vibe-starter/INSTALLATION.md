# VIBE Coding Starter Kit - Installation Guide

## Prerequisites

- Node.js 18+
- Claude Code CLI (`npm install -g @anthropic/claude-code`)

## Quick Install

### Option 1: Copy to Project (Recommended)

```bash
# Copy the .claude directory to your project root
cp -r .claude/ /path/to/your-project/

# Navigate to your project
cd /path/to/your-project

# Start Claude Code
claude
```

### Option 2: User-level Install

```bash
# Copy to your home .claude directory (affects all projects)
cp -r .claude/ ~/.claude/
```

## Verify Installation

```bash
# Start Claude Code
claude

# You should see the custom statusline with:
# - Session timer
# - Tool/agent tracking
# - Context window monitor

# Try a command:
/help
```

## Configuration

Edit `.claude/.ck.json` to customize:

```json
{
    "plan": {
        "namingFormat": "{date}-{issue}-{slug}",
        "dateFormat": "YYMMDD-HHmm"
    },
    "paths": {
        "docs": "docs",
        "plans": "plans"
    }
}
```

## Troubleshooting

### Statusline Not Showing

1. Ensure Node.js is installed: `node --version`
2. Check `.claude/statusline.cjs` is executable: `chmod +x .claude/statusline.cjs`

### Commands Not Working

1. Verify `.claude/commands/` directory exists
2. Check command files have `.md` extension

## Support

- Email: support@agencyos.network
- Discord: discord.gg/agencyos

---

© 2026 AgencyOS Network
