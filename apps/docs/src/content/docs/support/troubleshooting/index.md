---
title: Troubleshooting
description: "Documentation"
section: support
category: support/troubleshooting
order: 1
published: true
ai_executable: true
---

# Troubleshooting

---

## 🤖 Quick Execute

```
Execute: https://agencyos.network/docs/support/troubleshooting
```



Quick fixes for common issues. Most problems resolve in under 5 minutes.

## Quick Diagnosis

**Problem category?**
- [Installation fails](#installation) → [Installation Issues](/docs/support/troubleshooting/installation-issues)
- [Command not found or errors](#commands) → [Command Errors](/docs/support/troubleshooting/command-errors)
- [Agent not working](#agents) → [Agent Issues](/docs/support/troubleshooting/agent-issues)
- [API key errors](#api-keys) → [API Key Setup](/docs/support/troubleshooting/api-key-setup)
- [Slow or hanging](#performance) → [Performance Issues](/docs/support/troubleshooting/performance-issues)

## Installation

**Issue**: `ck: command not found`

**Fix**:
```bash
# Verify installation
ls mekong-cli

# Reinstall if needed
git clone https://github.com/longtho638-jpg/mekong-cli.git

# Verify
python main.py --version
```

[More installation fixes →](/docs/support/troubleshooting/installation-issues)

## Commands

**Issue**: `/command` does nothing

**Fix**:
1. Check `.agencyos/commands/` exists
2. Verify command file exists
3. Check frontmatter is valid

```bash
# List available commands
ls .agencyos/commands/**/*.md

# Test specific command
cat .agencyos/commands/core/cook.md
```

[More command fixes →](/docs/support/troubleshooting/command-errors)

## Agents

**Issue**: Agent not activating

**Fix**:
1. Verify `.agencyos/agents/` exists
2. Check agent file format
3. Confirm AgencyOS CLI is running

```bash
# List agents
ls .agencyos/agents/*.md

# Verify agent file
cat .agencyos/agents/planner.md
```

[More agent fixes →](/docs/support/troubleshooting/agent-issues)

## API Keys

**Issue**: "API key not found"

**Fix**:
```bash
# Add to .env
echo 'GEMINI_API_KEY=your-key' >> .env
echo 'SEARCH_API_KEY=your-key' >> .env

# Or export for session
export GEMINI_API_KEY=your-key
```

[Complete API key guide →](/docs/support/troubleshooting/api-key-setup)

## Performance

**Issue**: Commands take forever

**Fix**:
1. Check internet connection
2. Verify API keys are set
3. Use `--verbose` to see what's slow

```bash
# Run with verbose logging
/cook add feature --verbose
```

[More performance fixes →](/docs/support/troubleshooting/performance-issues)

## Common Quick Fixes

### Reset AgencyOS

```bash
# Backup first
cp -r .claude .claude.backup

# Update to latest
python main.py init --kit engineer

# Restore custom files
cp .claude.backup/commands/my-custom.md .agencyos/commands/
```

### Clear Cache

```bash
# Clear Node modules
rm -rf node_modules
npm install

# Clear AgencyOS cache
rm -rf ~/.agencyos/cache
```

### Verify Setup

```bash
# Check CLI
python main.py --version

# Check AgencyOS CLI
claude --version

# Check directory structure
tree .claude -L 2
```

## Still Stuck?

### Get Help

1. **Run diagnostics**:
   ```bash
   ck diagnose --verbose
   ```

2. **Check logs**:
   ```bash
   # Enable verbose mode
   export AGENCYOS_VERBOSE=1

   # Run command
   /cook add feature

   # Check output
   cat mekong-debug.log
   ```

3. **Report issue**:
   - GitHub: https://github.com/longtho638-jpg/agencyos-engineer/issues
   - Include: OS, CLI version, error message, steps to reproduce

### Community

- **Discord**: [Join AgencyOS Discord](https://agencyos.network/discord)
- **GitHub Discussions**: Share solutions, ask questions

## Prevention Tips

✅ **Do**:
- Keep AgencyOS updated (`python main.py init`)
- Use `--verbose` when debugging
- Backup before major changes
- Read error messages fully

❌ **Don't**:
- Modify core `.agencyos/` files directly
- Ignore API rate limits
- Skip version updates
- Delete `.agencyos/` directory

---

**95% of issues resolve in under 5 minutes** with these guides. Dive into specific sections for detailed fixes.
