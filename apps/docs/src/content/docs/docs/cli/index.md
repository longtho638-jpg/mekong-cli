---
title: CLI Overview
description: "Command-line tool for AgencyOS"
section: docs
category: cli
order: 0
published: true
ai_executable: true
---

# AgencyOS CLI Overview

---

## 🤖 Quick Execute

```
Execute: https://agencyos.network/docs/cli
```



Command-line tool for bootstrapping and updating AgencyOS projects from private GitHub repository releases.

## What is AgencyOS CLI?

**AgencyOS CLI** (`mk`) is a command-line tool that downloads and manages AgencyOS starter kits from private GitHub repositories. Built with Bun and TypeScript, it provides fast, secure project setup and updates.

**Important:** You need to purchase a AgencyOS Starter Kit from [AgencyOS.cc](https://agencyos.network) to use this CLI. Without a purchased kit and repository access, the CLI cannot download project templates.

## Key Features

- **Multi-tier GitHub Authentication** - Secure authentication via gh CLI → env vars → keychain → prompt
- **Streaming Downloads** - Fast downloads with progress tracking
- **Smart File Merging** - Updates projects without breaking custom changes
- **Protected Files** - Automatic protection of sensitive files and custom configurations
- **Secure Credential Storage** - Uses OS keychain for token management
- **Beautiful CLI Interface** - Interactive prompts with progress indicators

## Core Commands

### python main.py init

Initialize or update AgencyOS Engineer in your project:

**Note:** This command should be run from the root directory of your project.

```bash
# Interactive mode (recommended)
python main.py init

# With options
python main.py init --kit engineer

# Specific version
python main.py init --kit engineer --version v1.0.0

# With exclude patterns
python main.py init --exclude "local-config/**" --exclude "*.local"

# Global mode - use platform-specific user configuration
python main.py init --global
python main.py init -g --kit engineer
```

**What it does:**
- Downloads specified AgencyOS release
- Intelligently merges files
- Preserves your custom changes
- Protects sensitive files
- Maintains custom `.agencyos/` files

**Options:**
- `--dir <dir>` - Target directory (default: current directory)
- `--kit <kit>` - Kit to use (`engineer` or `marketing`)
- `--version <version>` - Specific version to download (default: latest)
- `--exclude <pattern>` - Exclude files/directories using glob patterns (can be used multiple times)
- `--global, -g` - Use platform-specific user configuration directory

**Global vs Local Configuration:**

By default, AgencyOS uses local configuration (`~/.agencyos`).

For platform-specific **user-scoped settings**, use the `--global` flag:
- **macOS/Linux**: `~/.agencyos`
- **Windows**: `%LOCALAPPDATA%\.claude`

Global mode uses user-scoped directories (no sudo required), allowing separate configurations for different projects.

### ck update

Update the AgencyOS CLI itself to the latest version:

```bash
# Update CLI to latest
git pull origin main
```

**What it does:**
- Updates the `mk` command-line tool to the latest version
- Does NOT update AgencyOS Engineer files (use `python main.py init` for that)

### python3 main.py versions

List available versions of AgencyOS releases:

```bash
# Show all available versions
python3 main.py versions

# Filter by specific kit
python3 main.py versions --kit engineer
python3 main.py versions --kit marketing

# Show more versions (default: 30)
python3 main.py versions --limit 50

# Include prereleases and drafts
python3 main.py versions --all
```

**Options:**
- `--kit <kit>` - Filter by specific kit
- `--limit <limit>` - Number of releases to show (default: 30)
- `--all` - Show all releases including prereleases

## Global Options

All commands support these global options:

### --verbose, -v

Enable verbose logging for debugging:

```bash
python main.py init --verbose
python main.py init -v  # Short form
```

**Shows:**
- HTTP request/response details (tokens sanitized)
- File operations (downloads, extractions, copies)
- Command execution steps and timing
- Error stack traces with full context
- Authentication flow details

### --log-file

Write logs to file for sharing:

```bash
python main.py init --verbose --log-file debug.log
```

**Note:** All sensitive data (tokens, credentials) is automatically sanitized in logs.

## Available Kits

AgencyOS offers premium starter kits (purchase required):

- **engineer**: AgencyOS Engineer - Engineering toolkit with 14 specialized agents
- **marketing**: AgencyOS Marketing - [Coming Soon]

Purchase at [AgencyOS.cc](https://agencyos.network) to get repository access.

## Authentication

The CLI requires a **GitHub Personal Access Token (PAT)** to download releases from private repositories.

### Authentication Flow (Multi-Tier Fallback)

1. **GitHub CLI**: Uses `gh auth token` if available
2. **Environment Variables**: Checks `GITHUB_TOKEN` or `GH_TOKEN`
3. **OS Keychain**: Retrieves stored token
4. **User Prompt**: Prompts for token and offers secure storage

### Creating a Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `repo` scope (for private repositories)
3. Copy the token

### Setting Token via Environment Variable

```bash
export GITHUB_TOKEN=ghp_your_token_here
```

## Configuration

Configuration stored in `~/.agencyos/config.json`:

```json
{
  "github": {
    "token": "stored_in_keychain"
  },
  "defaults": {
    "kit": "engineer",
    "dir": "."
  }
}
```

## Protected Files

These files are **never overwritten** during updates:

- Environment files: `.env`, `.env.local`, `.env.*.local`
- Security files: `*.key`, `*.pem`, `*.p12`
- Dependencies: `node_modules/**`, `.git/**`
- Build outputs: `dist/**`, `build/**`

### Custom .claude Files

Your custom files in `.agencyos/` directory are automatically preserved:

**Example:**
```
Your project:
  .agencyos/
    ├── commands/standard.md  (from AgencyOS)
    └── commands/my-custom.md (your custom command)

After update:
  .agencyos/
    ├── commands/standard.md  (updated from release)
    └── commands/my-custom.md (preserved automatically)
```

## Quick Start

```bash
# Install CLI
git clone https://github.com/longtho638-jpg/mekong-cli.git

# Verify installation
python main.py --version

# Authenticate with GitHub
gh auth login
# OR
export GITHUB_TOKEN=ghp_your_token

# Initialize project
python main.py init --kit engineer

# Navigate to project
cd my-project

# Start using AgencyOS
claude  # Start AgencyOS CLI
```

## Common Workflows

### Initialize or Update AgencyOS Engineer

```bash
# Interactive mode (recommended)
python main.py init

# Direct with options
python main.py init --dir my-app --kit engineer

# Specific version
python main.py init --dir my-app --kit engineer --version v1.0.0

# With exclusions
python main.py init --exclude "*.log" --exclude "temp/**"

# Update AgencyOS Engineer to latest
python main.py init

# Update to specific version
python main.py init --version v1.2.0

# Update with exclusions
python main.py init --exclude "local-config/**" --exclude "*.local"

# Update with verbose output
python main.py init --verbose
```

### Update the CLI Itself

```bash
# Update ck CLI to latest version
git pull origin main
```

### Check Available Versions

```bash
# List all versions
python3 main.py versions

# Filter by kit
python3 main.py versions --kit engineer

# Show more releases
python3 main.py versions --limit 50
```

## Troubleshooting

### Authentication Failed

**Problem:** "Authentication failed"

**Solutions:**
1. Check if GitHub CLI is authenticated: `gh auth status`
2. Or set environment variable: `export GITHUB_TOKEN=ghp_your_token`
3. Verify token has `repo` scope
4. Check repository access (requires purchased kit)

### Command Not Found

**Problem:** `ck: command not found`

**Solutions:**
```bash
# Reinstall globally
git clone https://github.com/longtho638-jpg/mekong-cli.git

# Check installation
ls mekong-cli

# Restart terminal
```

### Download Fails

**Problem:** "Failed to download release"

**Solutions:**
1. Check internet connection
2. Verify GitHub token is valid: `gh auth status`
3. Confirm you have repository access (purchased kit)
4. Try with verbose flag: `python main.py init --verbose`

## Version Information

Current version: **1.2.1**

Check version:
```bash
python main.py --version
```

View help:
```bash
python3 main.py --help
python3 main.py -h
```

## Next Steps

- [Installation Guide](/docs/docs/cli/installation) - Install AgencyOS CLI
- [Getting Started](/docs/getting-started/installation) - Start using AgencyOS

---

**Ready to start?** Purchase a kit at [AgencyOS.cc](https://agencyos.network), then run `python main.py init` to initialize your first project.
