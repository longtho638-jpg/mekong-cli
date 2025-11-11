# Statusline Architecture

## Overview

The Claude Code statusline system provides real-time context about the current development session across multiple platforms. This document describes the technical architecture and implementation details.

## Architecture Diagram

```
┌─────────────────────────────────────────────┐
│         Claude Code CLI                      │
│  (provides JSON context via stdin)          │
└─────────────────┬───────────────────────────┘
                  │ JSON
                  ▼
┌─────────────────────────────────────────────┐
│      Platform Detection Layer               │
│  (settings.json configuration)              │
└────┬──────────┬──────────┬─────────────────┘
     │          │          │
     ▼          ▼          ▼
┌────────┐ ┌─────────┐ ┌──────────┐
│  Bash  │ │PowerShell│ │ Node.js  │
│  .sh   │ │   .ps1   │ │   .js    │
└───┬────┘ └────┬─────┘ └────┬─────┘
    │           │             │
    │     ┌─────┴─────────────┴─────┐
    │     │   Feature Modules        │
    └─────┤   • Color System         │
          │   • Time Utilities       │
          │   • Git Integration      │
          │   • ccusage Integration  │
          │   • Progress Bar         │
          └──────────┬───────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  Formatted Output    │
          │  (ANSI + Unicode)    │
          └──────────────────────┘
```

## Implementation Comparison

### Three Implementations

| Component | Bash | PowerShell | Node.js |
|-----------|------|-----------|---------|
| **File** | `statusline.sh` | `statusline.ps1` | `statusline.js` |
| **Platform** | macOS, Linux, Git Bash, WSL | Windows 5.1+, Core 7+ | Universal (Win/Mac/Linux) |
| **Language** | Bash script | PowerShell script | JavaScript (Node.js) |
| **JSON Parsing** | `jq` command | `ConvertFrom-Json` | `JSON.parse()` |
| **External Deps** | jq, git, ccusage | git, npm/npx | git, npm/npx |
| **Color Support** | ANSI escape codes | Virtual Terminal API | ANSI escape codes |
| **TTY Detection** | `[ -t 1 ]` | `[Console]::IsOutputRedirected` | `stdout.isTTY` |
| **Git Commands** | `git branch --show-current` | Same | `execSync('git ...')` |
| **Time Conversion** | gdate/date/python3 | `[DateTime]::Parse()` | `new Date()` |
| **Performance** | ~150ms | ~200ms (5.1), ~100ms (7+) | ~100ms |

## Core Modules

### 1. Input Parsing Module

**Purpose:** Read and parse JSON context from stdin

**Bash Implementation:**
```bash
input=$(cat)
current_dir=$(echo "$input" | jq -r '.workspace.current_dir // .cwd // "unknown"')
```

**PowerShell Implementation:**
```powershell
$inputLines = @()
while ($null -ne ($line = [Console]::In.ReadLine())) {
    $inputLines += $line
}
$inputJson = $inputLines -join "`n"
$data = $inputJson | ConvertFrom-Json
```

**Node.js Implementation:**
```javascript
async function readStdin() {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stdin.on('data', chunk => chunks.push(chunk));
        stdin.on('end', () => resolve(chunks.join('')));
    });
}
const data = JSON.parse(await readStdin());
```

### 2. Color System Module

**Purpose:** Provide ANSI color codes with TTY detection and NO_COLOR support

**Architecture:**
```
┌──────────────────────┐
│  Color Request       │
└──────────┬───────────┘
           ▼
    ┌──────────────┐
    │ TTY Check    │
    │ NO_COLOR Env │
    └──────┬───────┘
           ▼
    ┌──────────────────┐
    │ Color Enabled?   │
    └─────┬─────┬──────┘
      YES │     │ NO
          ▼     ▼
    ┌─────────┐ ┌────────┐
    │ ANSI    │ │ Empty  │
    │ Codes   │ │ String │
    └─────────┘ └────────┘
```

**Color Codes Used:**
- `1;36` - Cyan (Directory, Cost)
- `1;32` - Green (Git branch, Session high)
- `1;35` - Magenta (Model, Tokens)
- `1;33` - Yellow (Version, Session medium)
- `1;31` - Red (Session low)
- `0` - Reset

**PowerShell Virtual Terminal:**

Windows PowerShell 5.1 requires enabling virtual terminal sequences:

```powershell
# Enable ANSI escape sequences
$handle = [WinAPI]::GetStdHandle(-11)  # STD_OUTPUT_HANDLE
$mode = 0
$null = [WinAPI]::GetConsoleMode($handle, [ref]$mode)
$mode = $mode -bor 0x0004  # ENABLE_VIRTUAL_TERMINAL_PROCESSING
$null = [WinAPI]::SetConsoleMode($handle, $mode)
```

PowerShell Core 7+ has built-in support.

### 3. Time Utilities Module

**Purpose:** Convert timestamps and format time displays

**Functions:**

1. **Epoch Conversion** (`to_epoch` / `ConvertTo-Epoch` / `toEpoch`)
   - Input: ISO8601 timestamp string
   - Output: Unix epoch (seconds since 1970-01-01)
   - Handles: Timezone conversion, format variations

2. **Time Formatting** (`fmt_time_hm` / `Format-TimeHM` / `formatTimeHM`)
   - Input: Unix epoch
   - Output: HH:MM formatted string
   - Uses: Local timezone

3. **Progress Bar** (`progress_bar` / `Get-ProgressBar` / `getProgressBar`)
   - Input: Percentage (0-100), width (default 10)
   - Output: String like `======----` (filled vs empty)
   - Characters: `=` for filled, `-` for empty

### 4. Git Integration Module

**Purpose:** Detect and display git repository information

**Detection Flow:**
```
┌────────────────────┐
│ Check Git Repo     │
│ git rev-parse      │
│   --git-dir        │
└─────┬──────────────┘
      │
      ▼
┌──────────────┐    No     ┌─────────────┐
│ In Git Repo? ├──────────►│ Skip Branch │
└──────┬───────┘           └─────────────┘
       │ Yes
       ▼
┌──────────────────────┐
│ Get Current Branch   │
│ git branch           │
│   --show-current     │
└──────┬───────────────┘
       │
       ▼
┌──────────────────┐    Empty    ┌──────────────┐
│ Branch Name?     ├────────────►│ Get HEAD SHA │
└──────┬───────────┘             │ git rev-parse│
       │ Found                   │   --short    │
       │                         └──────────────┘
       ▼
┌──────────────────┐
│ Display Branch   │
└──────────────────┘
```

**Error Handling:**
- Silent failure if not in git repository
- No error messages to user
- Graceful degradation (just don't show branch)

### 5. ccusage Integration Module

**Purpose:** Display session usage metrics (time, cost, tokens)

**Data Flow:**
```
┌───────────────────┐
│ Execute ccusage   │
│ npx ccusage       │
│   blocks --json   │
└────────┬──────────┘
         │
         ▼
┌─────────────────────┐
│ Parse JSON Response │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ Find Active Block   │
│ .isActive == true   │
└────────┬────────────┘
         │
         ▼
┌──────────────────────────┐
│ Extract Data:            │
│ • costUSD                │
│ • burnRate.costPerHour   │
│ • totalTokens            │
│ • startTime              │
│ • usageLimitResetTime    │
└────────┬─────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Calculate Session Time: │
│ • Total duration        │
│ • Elapsed time          │
│ • Remaining time        │
│ • Percentage used       │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────┐
│ Format Display:     │
│ • Progress bar      │
│ • Color by urgency  │
│ • Time until reset  │
└─────────────────────┘
```

**Session Color Logic:**
```javascript
remaining_pct = 100 - session_pct

if remaining_pct <= 10:
    color = RED     // Urgent
elif remaining_pct <= 25:
    color = YELLOW  // Warning
else:
    color = GREEN   // Normal
```

**Fallback Behavior:**
- If ccusage not found: Silent skip, no metrics shown
- If JSON parse fails: Silent skip
- If no active block: Silent skip

### 6. Output Rendering Module

**Purpose:** Assemble and display final statusline

**Render Order:**
1. 📁 Directory (cyan)
2. 🌿 Git branch (green) - optional
3. 🤖 Model name (magenta)
4. 🏷️ Model version (yellow) - optional
5. ⌛ Session time (dynamic color) - optional
6. [ ] Progress bar (dynamic color) - optional
7. 💵 Cost (cyan) - optional
8. 📊 Tokens (magenta) - optional

**Output Format:**
```
📁 ~/project  🌿 main  🤖 Claude Sonnet 4.5  🏷️ 3.5  ⌛ 2h 15m until reset at 14:30 (45%)  [====------]  💵 $0.23 ($1.05/h)  📊 1234 tok
```

## Data Structures

### Input JSON Schema

```json
{
  "workspace": {
    "current_dir": "/Users/name/project"
  },
  "cwd": "/Users/name/project",
  "model": {
    "display_name": "Claude Sonnet 4.5",
    "version": "3.5"
  }
}
```

### ccusage Blocks JSON Schema

```json
{
  "blocks": [
    {
      "isActive": true,
      "costUSD": "0.23",
      "burnRate": {
        "costPerHour": "1.05"
      },
      "totalTokens": "1234",
      "startTime": "2025-01-11T12:15:00Z",
      "usageLimitResetTime": "2025-01-11T14:30:00Z"
    }
  ]
}
```

## Error Handling Strategy

### Principle: Silent Degradation

All implementations follow the principle of graceful degradation:

1. **Input Errors:** Exit with error code 1
2. **Missing Tools:** Skip feature, continue rendering
3. **Invalid Data:** Use fallback values
4. **Command Failures:** Silent suppression

**Examples:**

```bash
# Bash: Silent git failure
git_branch=$(git branch --show-current 2>/dev/null || echo "")

# PowerShell: Try-catch for ccusage
try {
    $blocksOutput = npx ccusage@latest blocks --json 2>$null
} catch {
    # Silent fail - ccusage not available
}

# Node.js: Exec wrapper
function exec(cmd) {
    try {
        return execSync(cmd, { stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    } catch (err) {
        return '';
    }
}
```

## Performance Optimization

### Bash Implementation

**Optimizations:**
1. Single `jq` invocation for all JSON parsing
2. Conditional execution of expensive operations
3. Python fallback only when needed
4. Minimal subshell spawning

**Bottlenecks:**
- `jq` startup time (~50ms)
- Git command execution (~30ms)
- ccusage npm execution (~100ms)

### PowerShell Implementation

**Optimizations:**
1. Native JSON parsing (no external tools)
2. Minimal pipeline usage
3. Virtual terminal enabled once
4. String concatenation over repeated Write-Host

**Bottlenecks:**
- PowerShell 5.1 startup (~100ms)
- Virtual terminal setup (~20ms)
- Git/npm execution (~50ms)

### Node.js Implementation

**Optimizations:**
1. Single async stdin read
2. Minimal regex usage
3. Direct JSON.parse (no validation overhead)
4. Command execution with stdio pipes

**Bottlenecks:**
- Node.js startup (~50ms)
- execSync calls (~30ms each)

## Cross-Platform Considerations

### Path Handling

| Platform | Home Directory | Path Separator | Example |
|----------|---------------|----------------|---------|
| Windows | `C:\Users\name` | `\` | `C:\Users\name\project` |
| macOS | `/Users/name` | `/` | `/Users/name/project` |
| Linux | `/home/name` | `/` | `/home/name/project` |
| WSL | `/home/name` | `/` | `/home/name/project` |

**Home Expansion:**
- Windows: `$env:USERPROFILE` or `$env:HOME`
- Unix: `$HOME`
- Cross-platform: Both work in most contexts

### Command Availability

| Command | Windows | macOS | Linux | WSL |
|---------|---------|-------|-------|-----|
| `git` | Git for Windows | Built-in | Built-in | Built-in |
| `node` | Install | Install/Built-in | Install | Install |
| `npx` | With npm | With npm | With npm | With npm |
| `jq` | Git Bash/Manual | Homebrew | Package manager | Package manager |
| `pwsh` | Install | Install | Install | Install |

### Encoding

All implementations ensure UTF-8 encoding:

```bash
# Bash: UTF-8 by default on modern systems

# PowerShell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# Node.js
stdin.setEncoding('utf8');
```

## Testing Strategy

### Unit Testing

Test individual modules in isolation:

1. **Color System:**
   - TTY detection
   - NO_COLOR environment
   - ANSI code generation

2. **Time Utilities:**
   - Epoch conversion edge cases
   - Progress bar rendering
   - Time formatting

3. **Git Integration:**
   - Repository detection
   - Branch name extraction
   - Non-git directory handling

4. **ccusage Parsing:**
   - JSON parsing
   - Active block extraction
   - Session calculation

### Integration Testing

Test complete statusline with mock data:

```bash
# Test input
{
  "workspace": {"current_dir": "/test"},
  "model": {"display_name": "Test Model", "version": "1.0"}
}

# Expected output pattern
📁 /test  🤖 Test Model  🏷️ 1.0
```

### Platform Testing Matrix

| Platform | PowerShell | Node.js | Bash |
|----------|-----------|---------|------|
| Windows 10 (PS 5.1) | ✅ | ✅ | ✅ Git Bash |
| Windows 11 (PS 5.1) | ✅ | ✅ | ✅ Git Bash |
| Windows (PS 7+) | ✅ | ✅ | ✅ Git Bash |
| macOS | ✅ PS Core | ✅ | ✅ |
| Linux | ✅ PS Core | ✅ | ✅ |
| WSL Ubuntu | ✅ PS Core | ✅ | ✅ |

## Security Considerations

### Input Validation

All implementations validate JSON input:

```javascript
// Must be valid JSON
try {
    data = JSON.parse(input);
} catch (err) {
    console.error('Invalid JSON');
    exit(1);
}
```

### Command Injection Prevention

**Bash:**
```bash
# Safe - no user input in commands
git_branch=$(git branch --show-current 2>/dev/null)
```

**PowerShell:**
```powershell
# Safe - no Invoke-Expression of user data
$gitBranch = git branch --show-current 2>$null
```

**Node.js:**
```javascript
// Safe - no dynamic command construction
const output = execSync('git branch --show-current');
```

### Path Traversal Protection

Home directory expansion is safe:
```bash
# Only replaces exact home dir prefix
current_dir=$(echo "$input" | jq -r '.workspace.current_dir' | sed "s|^$HOME|~|")
```

## Future Enhancements

Potential improvements:

1. **Caching:** Cache git branch/ccusage for faster renders
2. **Async:** Non-blocking ccusage execution
3. **Themes:** User-customizable color schemes
4. **Icons:** Configurable emoji/icons
5. **Plugins:** Extensible module system
6. **Metrics:** Performance telemetry
7. **Alerts:** Threshold-based notifications

## Contributing

When modifying statusline implementations:

1. Maintain feature parity across all three
2. Test on all platforms
3. Preserve error handling strategy
4. Document new features
5. Update this architecture doc
6. Keep performance under 300ms

## References

- [Windows Statusline Support Guide](./statusline-windows-support.md) - Setup and configuration guide
- [Claude Code Documentation](https://code.claude.com/docs)
- [ANSI Escape Codes](https://en.wikipedia.org/wiki/ANSI_escape_code)
- [PowerShell Virtual Terminal](https://docs.microsoft.com/en-us/windows/console/console-virtual-terminal-sequences)
- [ccusage Tool](https://www.npmjs.com/package/@chongdashu/cc-statusline)
