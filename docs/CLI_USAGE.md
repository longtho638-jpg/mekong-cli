# Mekong CLI - Comprehensive Usage Guide

> 🐉 RaaS Agency Operating System - Plan → Execute → Verify

## Quick Start

```bash
# Install
pip install -e .

# Initialize
mekong init

# Run your first command
mekong cook "Create a new Python module"
```

---

## Core Commands

### `mekong cook` - Plan → Execute → Verify

**Usage:**
```bash
mekong cook "<goal>" [OPTIONS]
```

**Options:**
| Flag | Description | Default |
|------|-------------|---------|
| `--strict` | Strict verification mode | `True` |
| `--no-rollback` | Disable rollback on failure | `False` |
| `--verbose`, `-v` | Show step-by-step output | `False` |
| `--dry-run`, `-n` | Plan only, no execution | `False` |
| `--json`, `-j` | Machine-readable JSON output | `False` |

**Examples:**
```bash
# Full execution
mekong cook "Add user authentication to the app"

# Dry run (preview plan)
mekong cook "Deploy to production" --dry-run

# Verbose output
mekong cook "Fix TypeScript errors" --verbose

# JSON output for CI/CD
mekong cook "Run tests" --json
```

---

### `mekong plan` - Generate Execution Plan

**Usage:**
```bash
mekong plan "<goal>" [OPTIONS]
```

**Options:**
| Flag | Description | Default |
|------|-------------|---------|
| `--complexity` | Task complexity: simple/moderate/complex | `moderate` |

**Examples:**
```bash
# Basic plan
mekong plan "Refactor database schema"

# Complex task breakdown
mekong plan "Migrate to microservices" --complexity complex
```

---

### `mekong ask` - Quick Q&A

**Usage:**
```bash
mekong ask "<question>"
```

**Examples:**
```bash
mekong ask "How do I add a new API endpoint?"
mekong ask "What is the project structure?"
```

---

### `mekong debug` - Debug Issues

**Usage:**
```bash
mekong debug "<issue>" [OPTIONS]
```

**Options:**
| Flag | Description | Default |
|------|-------------|---------|
| `--dry-run` | Plan only (no execution) | `True` |
| `--execute` | Execute fix immediately | `False` |

**Examples:**
```bash
# Preview fix plan
mekong debug "Login failing on Safari"

# Execute fix immediately
mekong debug "TypeError in parser" --execute
```

---

### `mekong gateway` - Start API Server

**Usage:**
```bash
mekong gateway [OPTIONS]
```

**Options:**
| Flag | Description | Default |
|------|-------------|---------|
| `--port`, `-p` | Server port | `8000` |
| `--host`, `-H` | Bind address | `127.0.0.1` |

**Examples:**
```bash
mekong gateway
mekong gateway --port 9000 --host 0.0.0.0
```

---

### `mekong dash` - Interactive Dashboard

**Usage:**
```bash
mekong dash
```

One-button action menu for common tasks.

---

## Legacy Commands

| Command | Description |
|---------|-------------|
| `mekong binh-phap` | Binh Pháp Strategy tools |
| `mekong agi` | AGI daemon management |
| `mekong status` | System health check |
| `mekong config` | Environment configuration |
| `mekong doctor` | Diagnostics |
| `mekong clean` | Clean build artifacts |
| `mekong test` | Run test suite |
| `mekong build` | Build project |
| `mekong deploy` | Deploy applications |
| `mekong lint` | Lint code |
| `mekong docs` | Documentation tools |
| `mekong monitor` | Monitoring |
| `mekong security` | Security scanning |
| `mekong ci` | CI/CD management |
| `mekong env` | Environment management |

---

## Common Workflows

### 1. New Feature Development
```bash
# Step 1: Plan
mekong plan "Add OAuth2 authentication"

# Step 2: Execute
mekong cook "Add OAuth2 authentication" --verbose

# Step 3: Verify
mekong test
```

### 2. Debug & Fix
```bash
# Step 1: Debug (preview)
mekong debug "API timeout errors" --dry-run

# Step 2: Execute fix
mekong debug "API timeout errors" --execute
```

### 3. CI/CD Integration
```bash
# JSON output for parsing
mekong cook "Run smoke tests" --json > results.json

# Parse results
jq '.success_rate' results.json
```

---

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | Failure (verification failed, errors) |
| `2` | Invalid command/arguments |

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `MEKONG_API_KEY` | API key for LLM provider |
| `MEKONG_CONFIG` | Custom config path |
| `ANTHROPIC_BASE_URL` | LLM proxy URL |
| `ANTHROPIC_MODEL` | Model name |

---

## Troubleshooting

### "No such command" error
Ensure commands registered in `src/cli/commands_registry.py`.

### LLM connection failed
Check `ANTHROPIC_BASE_URL` and API key configuration.

### Tests failing after cook
Run `mekong test --verbose` for detailed output.
