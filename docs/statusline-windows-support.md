# Windows Statusline Support Guide

## Overview

Claude Code statusline now supports Windows through multiple implementation options:
- **PowerShell** (Windows native - recommended)
- **Node.js** (Universal fallback)
- **Git Bash** (Existing bash script)
- **WSL** (Windows Subsystem for Linux)

## Quick Start

Choose the option that works best for your environment:

### Option 1: PowerShell (Recommended for Windows)

**Prerequisites:**
- Windows 10/11 with PowerShell 5.1+ (included by default)
- OR PowerShell Core 7+ (cross-platform)
- Git for Windows installed

**Setup:**

1. Edit `.claude/settings.json` in your project:

```json
{
  "statusLine": ".claude/statusline.ps1"
}
```

2. Test the statusline:

```powershell
# Create a test JSON input
$testInput = @'
{
  "workspace": {"current_dir": "C:\\Users\\YourName\\project"},
  "model": {"display_name": "Claude", "version": "3.5"}
}
'@

$testInput | powershell -File .claude/statusline.ps1
```

**Features:**
- ✅ Native ANSI color support
- ✅ Built-in JSON parsing
- ✅ Fast execution
- ✅ No external dependencies (except Git)

### Option 2: Node.js (Universal Fallback)

**Prerequisites:**
- Node.js 16+ installed
- Git (optional, for branch display)

**Setup:**

1. Edit `.claude/settings.json`:

```json
{
  "statusLine": "node .claude/statusline.js"
}
```

2. Test the statusline:

```bash
# Create a test JSON input
echo '{"workspace":{"current_dir":"'$(pwd)'"},"model":{"display_name":"Claude"}}' | node .claude/statusline.js
```

**Features:**
- ✅ True cross-platform (Windows, macOS, Linux)
- ✅ No external dependencies
- ✅ Consistent behavior everywhere
- ✅ Works in any shell (cmd, PowerShell, bash)

### Option 3: Git Bash (Existing Solution)

**Prerequisites:**
- Git for Windows with Git Bash

**Setup:**

1. Edit `.claude/settings.json`:

```json
{
  "statusLine": ".claude/statusline.sh"
}
```

2. Ensure you're running Claude Code from Git Bash terminal

**Features:**
- ✅ Uses existing bash implementation
- ✅ Requires `jq` (install via Git Bash package manager)

### Option 4: WSL (Windows Subsystem for Linux)

**Prerequisites:**
- WSL 1 or WSL 2 enabled
- Ubuntu or other Linux distribution

**Setup:**

1. Run Claude Code from WSL terminal

2. Use default bash configuration:

```json
{
  "statusLine": ".claude/statusline.sh"
}
```

**Features:**
- ✅ Full Linux compatibility
- ✅ No modifications needed
- ⚠️ May have path translation issues between Windows/Linux

## Configuration Reference

### PowerShell Configuration

The PowerShell implementation supports:

- **ANSI Colors**: Automatically enabled in PowerShell 7+, requires virtual terminal in PowerShell 5.1
- **NO_COLOR**: Set `$env:NO_COLOR=1` to disable colors
- **UTF-8 Encoding**: Automatically configured
- **Git Integration**: Detects current branch if in repository
- **ccusage**: Integrates with `npx ccusage` or `ccusage` command

### Node.js Configuration

The Node.js implementation:

- **Cross-platform Paths**: Handles Windows and Unix paths
- **TTY Detection**: Colors only when output is to terminal
- **NO_COLOR**: Respects `NO_COLOR` environment variable
- **Git Integration**: Uses git commands if available
- **ccusage**: Tries `npx ccusage@latest` then `ccusage`

### Environment Variables

Both implementations respect these environment variables:

- `NO_COLOR`: Set to any value to disable ANSI colors
- `HOME` / `USERPROFILE`: Used for `~` expansion
- `PATH`: Must include git, node, npx (depending on chosen option)

## Features

All implementations provide feature parity:

| Feature | PowerShell | Node.js | Bash | WSL |
|---------|-----------|---------|------|-----|
| Directory display | ✅ | ✅ | ✅ | ✅ |
| Home `~` expansion | ✅ | ✅ | ✅ | ✅ |
| Git branch | ✅ | ✅ | ✅ | ✅ |
| Model name/version | ✅ | ✅ | ✅ | ✅ |
| Session time | ✅ | ✅ | ✅ | ✅ |
| Progress bar | ✅ | ✅ | ✅ | ✅ |
| Cost metrics | ✅ | ✅ | ✅ | ✅ |
| Token count | ✅ | ✅ | ✅ | ✅ |
| ANSI colors | ✅ | ✅ | ✅ | ✅ |
| NO_COLOR support | ✅ | ✅ | ✅ | ✅ |

## Troubleshooting

### PowerShell: Colors not working

**Problem:** Colors not displaying in PowerShell 5.1

**Solution:**
1. Try PowerShell Core 7+ (recommended): `winget install Microsoft.PowerShell`
2. Or enable virtual terminal in Windows Terminal
3. Or use Node.js fallback

### PowerShell: Script execution blocked

**Problem:** "Running scripts is disabled on this system"

**Solution:**
```powershell
# Allow script execution for current user
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Node.js: Command not found

**Problem:** `node` command not found

**Solution:**
1. Install Node.js from https://nodejs.org
2. Ensure Node.js bin directory is in PATH
3. Restart terminal after installation

### ccusage not working

**Problem:** Session time/cost not showing

**Solution:**
1. Install ccusage: `npm install -g @chongdashu/cc-statusline`
2. Or use `npx ccusage@latest` (no install needed)
3. Verify it works: `npx ccusage blocks --json`

### Git branch not showing

**Problem:** Git branch not displayed

**Solution:**
1. Ensure Git is installed and in PATH
2. Check you're in a git repository: `git status`
3. Verify git commands work: `git branch --show-current`

### Long paths on Windows

**Problem:** Directory paths truncated or not shown

**Solution:**
1. Enable long path support (Windows 10 1607+):
   - Run as Administrator: `reg add HKLM\SYSTEM\CurrentControlSet\Control\FileSystem /v LongPathsEnabled /t REG_DWORD /d 1`
2. Or use Node.js implementation (better path handling)

### Unicode/Emoji not displaying

**Problem:** Emoji characters show as `?` or boxes

**Solution:**
1. Ensure terminal supports UTF-8
2. PowerShell: Already configured in script
3. CMD: Not recommended, use PowerShell or Windows Terminal
4. Windows Terminal: Supports emoji out of the box

## Performance

Expected execution times:

| Implementation | Cold Start | Warm Start | With ccusage |
|---------------|-----------|-----------|--------------|
| PowerShell 5.1 | ~250ms | ~150ms | ~300ms |
| PowerShell 7+ | ~150ms | ~100ms | ~250ms |
| Node.js | ~100ms | ~50ms | ~200ms |
| Bash (Git Bash) | ~150ms | ~100ms | ~250ms |
| WSL | ~100ms | ~80ms | ~200ms |

## Testing Your Configuration

Test your statusline configuration with this script:

```bash
# Create test input
cat > /tmp/test-statusline.json << 'EOF'
{
  "workspace": {
    "current_dir": "/Users/test/project"
  },
  "cwd": "/Users/test/project",
  "model": {
    "display_name": "Claude Sonnet 4.5",
    "version": "3.5"
  }
}
EOF

# Test PowerShell
cat /tmp/test-statusline.json | powershell -File .claude/statusline.ps1

# Test Node.js
cat /tmp/test-statusline.json | node .claude/statusline.js

# Test Bash
cat /tmp/test-statusline.json | bash .claude/statusline.sh
```

## Advanced Configuration

### Custom Colors

Edit the color definitions in your chosen script:

**PowerShell** (`.claude/statusline.ps1`):
```powershell
$DirColor = Get-Color "1;36"      # cyan
$GitColor = Get-Color "1;32"      # green
$ModelColor = Get-Color "1;35"    # magenta
```

**Node.js** (`.claude/statusline.js`):
```javascript
const DirColor = color('1;36');      // cyan
const GitColor = color('1;32');      // green
const ModelColor = color('1;35');    // magenta
```

### Disable Specific Features

Comment out sections in the script to disable features you don't want:

```powershell
# To disable git branch display:
# if ($gitBranch) {
#     $output += "  🌿 ${GitColor}${gitBranch}${Reset}"
# }
```

## Platform Compatibility Matrix

| Platform | PowerShell | Node.js | Bash | Recommended |
|----------|-----------|---------|------|-------------|
| Windows 10 | ✅ 5.1+ | ✅ | ✅ Git Bash | PowerShell |
| Windows 11 | ✅ 5.1+ | ✅ | ✅ Git Bash | PowerShell |
| Windows Server | ✅ 5.1+ | ✅ | ✅ Git Bash | PowerShell |
| macOS | ✅ Core 7+ | ✅ | ✅ | Bash |
| Linux | ✅ Core 7+ | ✅ | ✅ | Bash |
| WSL | ✅ Core 7+ | ✅ | ✅ | Bash |

## Migration Guide

### From Bash to PowerShell

1. Backup your current configuration
2. Update `.claude/settings.json` to use `.claude/statusline.ps1`
3. Test in PowerShell terminal
4. Revert to bash if issues occur

### From PowerShell to Node.js

1. Install Node.js if not already installed
2. Update `.claude/settings.json` to use `node .claude/statusline.js`
3. Test with sample input
4. No other changes needed

## FAQ

**Q: Which implementation should I use?**

A:
- Windows users: PowerShell (fastest, native)
- Cross-platform projects: Node.js (most consistent)
- Git Bash users: Bash (existing solution)
- WSL users: Bash (full compatibility)

**Q: Can I use multiple implementations?**

A: Yes, all three scripts are included. Switch by updating `.claude/settings.json`

**Q: Do I need admin rights?**

A: No, except for:
- PowerShell execution policy (one-time, user-level)
- Long path support (optional, system-level)

**Q: Will this work in VS Code integrated terminal?**

A: Yes, all implementations work in VS Code terminal

**Q: Can I customize the output format?**

A: Yes, edit the script files directly. They're designed to be readable and modifiable.

**Q: What if ccusage is not available?**

A: Statusline will work without ccusage, just won't show session time/cost/tokens

## Support

If you encounter issues:

1. Check troubleshooting section above
2. Test with sample input (see Testing section)
3. Verify dependencies are installed
4. Check terminal compatibility
5. Report issues on GitHub

## See Also

- [Claude Code Documentation](https://code.claude.com/docs)
- [Statusline Architecture](./statusline-architecture.md)
- [Project README](../README.md)
