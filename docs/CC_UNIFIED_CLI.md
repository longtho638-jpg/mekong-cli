# 🏯 AgencyOS Unified CLI (cc) - Quick Reference

> **Version:** 0.2.0
> **Location:** `/scripts/cc`
> **Type:** Unified dispatcher for all CC modules

## Overview

The `cc` command provides a unified entry point for all AgencyOS CLI modules, dispatching commands to specialized modules based on the first argument.

## Architecture

```
cc <module> <command> [args...]
   ↓
   ├─ revenue  → cc_revenue.py  (Revenue tracking & forecasting)
   ├─ agent    → cc_agent.py    (Agent management & orchestration)
   ├─ devops   → cc_devops.py   (Deployment & infrastructure)
   ├─ client   → cc_client.py   (Client management & CRM)
   └─ release  → cc_release.py  (Release automation)
```

## Global Commands

| Command | Description |
|---------|-------------|
| `cc --help` | Show all available modules and examples |
| `cc --version` | Show version and module registry |
| `cc <module> --help` | Show module-specific help |

## Module Reference

### 1. Revenue Module
**Purpose:** Financial tracking, forecasting, and pricing strategy

```bash
cc revenue summary          # Revenue summary by period
cc revenue forecast         # AI-powered revenue forecast
cc revenue affiliates       # Affiliate commission report
cc revenue export           # Export to CSV

# Examples
cc revenue forecast --mrr 10000 --growth 0.15 --months 12
cc revenue summary --period monthly --year 2026
```

### 2. Agent Module
**Purpose:** Multi-agent spawning, orchestration, and coordination

```bash
cc agent spawn <type>       # Spawn new agent
cc agent status             # Show agent status
cc agent kill <id>          # Terminate agent
cc agent swarm              # Swarm operations
cc agent logs <id>          # Stream agent logs

# Examples
cc agent spawn --task T001 --model gemini-3-flash
cc agent status --filter active
cc agent swarm deploy --tasks T001,T002,T003
```

### 3. DevOps Module
**Purpose:** Deployment, monitoring, backup, and log management

```bash
cc devops deploy            # Deployment commands
cc devops monitor           # Monitoring commands
cc devops backup            # Backup commands
cc devops logs              # Log management

# Examples
cc devops deploy --env production --service api
cc devops monitor health --service all
cc devops backup create --target database
```

### 4. Client Module
**Purpose:** Client onboarding, invoicing, and relationship management

```bash
cc client add               # Onboard new client
cc client list              # List all clients
cc client portal            # Generate portal link
cc client invoice           # Create invoice
cc client status            # Health/status report

# Examples
cc client add --name "Acme Corp" --plan enterprise
cc client list --status active
cc client invoice --client acme --amount 5000
```

### 5. Release Module
**Purpose:** Release automation, versioning, and deployment

```bash
cc release create <version> # Create new release
cc release build            # Build Docker + Python package
cc release publish          # Publish to registries
cc release deploy           # Deploy to environment
cc release rollback         # Rollback to previous version

# Examples
cc release create 1.0.0
cc release build --tag latest
cc release publish --registry dockerhub
cc release deploy --env staging
```

## Error Handling

### Invalid Module
```bash
$ cc invalid-module
❌ Error: Unknown module 'invalid-module'

Available modules: revenue agent devops client release
Run 'cc --help' for more information.
```

### Missing Module Script
```bash
$ cc revenue  # If cc_revenue.py missing
❌ Error: Module script not found: /path/to/cc_revenue.py
```

## Installation & Setup

### Make Executable
```bash
chmod +x scripts/cc
```

### Add to PATH (Optional)
```bash
# Add to ~/.bashrc or ~/.zshrc
export PATH="/Users/macbookprom1/mekong-cli/scripts:$PATH"

# Now you can run from anywhere
cc --help
```

### Verify Installation
```bash
cc --version
# Output:
# AgencyOS Unified CLI (cc) v0.2.0
# Modules:
#   - agent (cc_agent.py)
#   - client (cc_client.py)
#   - devops (cc_devops.py)
#   - release (cc_release.py)
#   - revenue (cc_revenue.py)
```

## Development

### Adding New Modules

1. **Create module script:**
   ```bash
   touch scripts/cc_newmodule.py
   chmod +x scripts/cc_newmodule.py
   ```

2. **Register in `scripts/cc`:**
   ```bash
   declare -A MODULES=(
       ...
       ["newmodule"]="cc_newmodule.py"
   )
   ```

3. **Update help text:**
   ```bash
   show_help() {
       cat <<EOF
   Available Modules:
     ...
     newmodule   Description of new module
   EOF
   }
   ```

### Module Requirements

Each module (`cc_*.py`) should:
- Accept `--help` flag
- Use consistent CLI framework (argparse, typer, click)
- Return proper exit codes (0=success, 1=error)
- Provide descriptive error messages
- Support `--version` flag (optional)

## Integration with Other Systems

### CLEO Task Management
```bash
# Create task for agent work
ct add "Deploy to production" --phase devops

# Execute with cc
cc devops deploy --env production
```

### CI/CD Integration
```yaml
# .github/workflows/release.yml
- name: Create Release
  run: scripts/cc release create ${{ github.ref_name }}

- name: Build Artifacts
  run: scripts/cc release build

- name: Deploy
  run: scripts/cc release deploy --env production
```

### Agent Orchestration
```bash
# Spawn multiple agents for parallel work
cc agent swarm deploy \
  --tasks T001,T002,T003 \
  --model gemini-3-flash \
  --concurrency 3
```

## Best Practices

1. **Always use module-specific help first:**
   ```bash
   cc revenue --help  # Not just 'cc --help'
   ```

2. **Verify module exists before scripting:**
   ```bash
   if cc --version | grep -q "revenue"; then
     cc revenue forecast ...
   fi
   ```

3. **Use full paths in automation:**
   ```bash
   /Users/macbookprom1/mekong-cli/scripts/cc release create 1.0.0
   ```

4. **Check exit codes:**
   ```bash
   if cc devops deploy --env prod; then
     echo "✅ Deployment successful"
   else
     echo "❌ Deployment failed"
     exit 1
   fi
   ```

## Troubleshooting

### Python Not Found
```bash
# Set PYTHON environment variable
export PYTHON=/usr/local/bin/python3
cc --version
```

### Module Script Not Executable
```bash
chmod +x scripts/cc_*.py
```

### Module Dispatch Failing
```bash
# Check script location
ls -la scripts/cc_*.py

# Test module directly
python3 scripts/cc_revenue.py --help
```

## Related Documentation

- [CC Revenue Module](./CC_REVENUE_MODULE.md)
- [CC Agent Module](./CC_AGENT_MODULE.md)
- [CC DevOps Module](./CC_DEVOPS_MODULE.md)
- [CC Client Module](./CC_CLIENT_MODULE.md)
- [CC Release Module](./CC_RELEASE_MODULE.md)
- [Release System](./RELEASE_SYSTEM.md)
- [CLEO Task Management](../.cleo/templates/AGENT-INJECTION.md)

## Support

- **Repository:** https://github.com/binhphap/mekong-cli
- **Documentation:** `/docs/`
- **Issues:** Report via GitHub Issues
- **Contact:** Antigravity Team

---

**Last Updated:** 2026-01-25
**Version:** 0.2.0
**Status:** ✅ Production Ready
