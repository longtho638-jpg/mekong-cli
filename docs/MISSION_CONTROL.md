# MISSION CONTROL - Software Factory Orchestration

> **4-Tab Parallel Agent Orchestration Model**
> Version: 2.0.0 | Status: OPERATIONAL | Last Updated: 2026-01-25

---

## Overview

Mission Control coordinates 4 specialized agent workflows running in parallel Claude Code tabs. Each agent operates independently with specific responsibilities while maintaining data synchronization through the mekong-cli monorepo.

## The 4 Agent Tabs

### 1. 🏗️ **architect-prompts** (The Brain)
**Mode**: Planning Mode
**Workflow**: `.agent/workflows/architect-prompts.md`
**Responsibilities**:
- Project structure planning and scaffolding
- Tech stack selection and justification
- Architecture decision records (ADRs)
- Implementation plan creation
- Dependency mapping and sequencing

**Activation**:
```bash
cc --mode plan
# Then use prompts from .agent/workflows/architect-prompts.md
```

**Key Commands**:
- `cc plan` - Create implementation plans
- `cc scaffold` - Generate project structure
- `cc agent` - Spawn planning subagents

---

### 2. 💰 **revenue-prompts** (The Cash Flow)
**Mode**: Fast Mode
**Workflow**: `.agent/workflows/revenue-prompts.md`
**Responsibilities**:
- Subscription management and billing
- Payment integration (Stripe, SePay)
- Financial reporting and dashboards
- Revenue analytics and forecasting
- Pricing tier implementation

**Activation**:
```bash
cc --mode fast
# Then use prompts from .agent/workflows/revenue-prompts.md
```

**Key Commands**:
- `cc integrate:stripe` - Payment setup
- `cc revenue:track` - Monitor MRR/ARR
- `cc subscription:manage` - Billing logic

---

### 3. 📢 **growth-prompts** (The Loudspeaker)
**Mode**: Agent-Driven
**Workflow**: `.agent/workflows/growth-prompts.md`
**Responsibilities**:
- Marketing content generation
- SEO optimization and metadata
- Social media campaigns
- Lead magnet creation
- Email automation flows

**Activation**:
```bash
cc --mode agent
# Then use prompts from .agent/workflows/growth-prompts.md
```

**Key Commands**:
- `cc content:generate` - Marketing copy
- `cc seo:optimize` - SEO audit
- `cc campaign:social` - Social posts

---

### 4. 🛡️ **sre-prompts** (The Shield)
**Mode**: Secure Mode
**Workflow**: `.agent/workflows/sre-prompts.md`
**Responsibilities**:
- Security audits and vulnerability scanning
- Infrastructure monitoring and health checks
- Disaster recovery planning
- Performance optimization
- Compliance and access control

**Activation**:
```bash
cc --mode secure
# Then use prompts from .agent/workflows/sre-prompts.md
```

**Key Commands**:
- `cc security:audit` - Security scan
- `cc monitor:health` - System status
- `cc recovery:plan` - DR setup

---

## Additional Support Workflows

### 5. 🚀 **release-prompts** (The Launcher)
**Workflow**: `.agent/workflows/release-prompts.md`
**Purpose**: Production deployment, versioning, changelog generation

### 6. 🤝 **crm-prompts** (The Connector)
**Workflow**: `.agent/workflows/crm-prompts.md`
**Purpose**: Customer relationship management, lead tracking, pipeline automation

---

## Orchestration Patterns

### Parallel Execution
Run all 4 core agents simultaneously in separate terminal tabs:

```bash
# Tab 1: Architect
cd /Users/macbookprom1/mekong-cli
cc --mode plan

# Tab 2: Revenue
cd /Users/macbookprom1/mekong-cli
cc --mode fast

# Tab 3: Growth
cd /Users/macbookprom1/mekong-cli
cc --mode agent

# Tab 4: SRE
cd /Users/macbookprom1/mekong-cli
cc --mode secure
```

### Sequential Handoffs
For dependencies between workflows:

1. **Architect** creates implementation plan
2. **Revenue** implements payment logic
3. **Growth** generates marketing content
4. **SRE** audits security and deploys

### Data Synchronization

All agents share the same monorepo state:
- **Version**: Synced via `package.json` (v2.0.0)
- **Git**: Shared repository at `/Users/macbookprom1/mekong-cli`
- **Tasks**: CLEO task management (`.cleo/tasks.json`)
- **Docs**: Centralized in `docs/` directory

#### ✅ Schema Sync Status (2026-01-25)

**Cross-Agent Schema Synchronization - COMPLETE**

**Architect (Tab 1) ↔ Revenue (Tab 2) User Model Sync:**
- **Status**: ✅ SYNC COMPLETE
- **Document**: `docs/SCHEMA_SYNC.md`
- **Requirements Documented**:
  - User model fields for Stripe integration
  - `stripe_customer_id`, `stripe_subscription_id` fields
  - `subscription_tier`, `billing_status` enums
  - Revenue tracking fields (`lifetime_value`, `monthly_recurring_revenue`)
  - Subscription date fields (`subscription_start_date`, `subscription_end_date`, `trial_end_date`)
- **Integration Points**:
  - Stripe Service webhook handlers
  - Provisioning Service subscription management
  - Analytics Service revenue tracking

**Next Steps**: Implement User model → Update Stripe/Provisioning services → Test webhooks

---

## Health Monitoring

### Pre-Flight Checklist
Before activating workflows:

```bash
# 1. Verify all workflow files exist
ls -la .agent/workflows/*-prompts.md

# 2. Check package version sync
cat package.json | grep version

# 3. Validate CC CLI availability
which cc && echo "✅ CC CLI Ready"

# 4. Check git status
git status

# 5. Verify CLEO session
ct session status
```

### System Health Check
```bash
# Run comprehensive health check
cc monitor health

# Check individual systems
cc monitor --subsystem database
cc monitor --subsystem api
cc monitor --subsystem auth
```

---

## Emergency Protocols

### Agent Failure Recovery
If an agent crashes or hangs:

```bash
# 1. Check session state
ct session list

# 2. Resume or start new session
ct session resume <session-id>
# OR
ct session start --scope epic:T001 --auto-focus

# 3. Check last command
ct history --days 1
```

### Data Corruption
If synchronization fails:

```bash
# 1. Validate CLEO integrity
ct validate --fix

# 2. Check git conflicts
git status
git diff

# 3. Restore from backup if needed
ct restore
```

---

## Workflow Integration Points

### Architect → Revenue
- Architect defines payment schema → Revenue implements Stripe integration

### Architect → Growth
- Architect outlines product features → Growth creates marketing copy

### Revenue → SRE
- Revenue implements billing → SRE audits payment security

### Growth → SRE
- Growth deploys landing pages → SRE monitors performance

---

## Performance Metrics

### Target Response Times
- **Architect**: Plan generation < 2 min
- **Revenue**: Payment integration < 5 min
- **Growth**: Content generation < 1 min
- **SRE**: Security scan < 3 min

### Throughput Goals
- **Daily Tasks Completed**: 20-30 across all agents
- **Weekly Deploys**: 3-5 production releases
- **Monthly Revenue**: Track MRR/ARR growth

---

## Configuration Files

### Global Agent Config
```
~/.claude/CLAUDE.md          # Global Claude instructions
~/.claude/workflows/         # Global workflow templates
```

### Project Agent Config
```
.agent/CLAUDE_INSTRUCTIONS.md  # Project-specific instructions
.agent/workflows/              # Workflow prompt collections
.agent/skills/                 # Specialized skill modules
```

---

## Quick Reference

### Workflow Activation Commands
| Agent | Command | Mode |
|-------|---------|------|
| Architect | `cc --mode plan` | Planning |
| Revenue | `cc --mode fast` | Fast |
| Growth | `cc --mode agent` | Agent-Driven |
| SRE | `cc --mode secure` | Secure |
| Release | `cc --mode release` | Production |
| CRM | `cc --mode crm` | Customer |

### Session Management
```bash
# Start multi-session work
ct session start --scope epic:T001 --auto-focus --name "Feature X"

# Check active sessions
ct session list --status active

# Switch between sessions
ct session switch <session-id>

# End session
ct session end --note "Completed phase 1"
```

---

## Factory Status Dashboard

### Current State (2026-01-25)
```
✅ Workflows: 6/6 operational
✅ Version: 2.0.0 synced
✅ CC CLI: Available
✅ Git: Clean working tree
✅ CLEO: Session ready
```

### Operational Readiness
- **Architect**: ✅ Ready
- **Revenue**: ✅ Ready
- **Growth**: ✅ Ready
- **SRE**: ✅ Ready
- **Release**: ✅ Ready
- **CRM**: ✅ Ready

---

## Next Steps

1. **Activate Primary Workflow**: Choose architect/revenue/growth/sre based on current priority
2. **Initialize Session**: `ct session start` with appropriate scope
3. **Load Workflow Prompts**: Open `.agent/workflows/<agent>-prompts.md`
4. **Execute Tasks**: Follow prompt sequences in workflow file
5. **Monitor Progress**: `ct dash` and `cc monitor health`

---

**FACTORY STATUS**: 🟢 OPERATIONAL

Mission Control is ready for parallel agent orchestration. All systems nominal.

---

*For detailed workflow instructions, see individual files in `.agent/workflows/`*
*For CLEO task management, run `ct help` or check `~/.cleo/docs/TODO_Task_Management.md`*
