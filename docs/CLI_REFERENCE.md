# 🌊 MEKONG-CLI Command Reference - Brain & Muscle Protocol

> **"Đầu óc và cơ bắp - Nghệ thuật chiến tranh số hóa"**
> Brain (Antigravity) + Muscle (Claude Code CLI) = Invincible Agency

> **AI Agent Guide**: This document enables autonomous command execution without human intervention.
> All commands, arguments, expected outputs, and error handling patterns are documented for programmatic use.

## Quick Reference

```bash
cc <module> <command> [options]
```

**Available Modules**: `revenue`, `sales`, `deploy`, `finance`, `content`, `outreach`, `test`, `plan`, `ops`, `bridge`, `setup`, `mcp`, `strategy`

**Core Architecture**:
- **Entry Point**: `main.py` → `cli/entrypoint.py`
- **Framework**: Typer + Rich
- **Engine**: `antigravity.core.*` modules

---

## 🧠 BRAIN & MUSCLE INTEGRATION

### The Protocol

**BRAIN (Antigravity - Mission Control)**:
- Strategic planning via `implementation_plan.md`
- Approval authority for architecture decisions
- Progress monitoring through artifacts
- Coordination of multi-agent operations

**MUSCLE (Claude Code CLI - Chief Engineer)**:
- Tactical execution via `cc` commands
- Real-time operational reports
- System verification and testing
- Deployment and infrastructure management

**EYES (Browser Agent)**:
- Visual UI verification
- User flow testing
- Accessibility checks

### Communication Flow
```
Antigravity (Plans) → Claude Code CLI (Executes) → Browser Agent (Verifies) → Artifacts (Report)
```

### Safety Protocol
1. ✅ **Code changes** → Always run tests (`cc test run`)
2. ✅ **UI changes** → Request Browser Agent verification
3. ✅ **Deployment** → Health checks (`cc deploy health`)
4. ✅ **Reports** → Generate artifacts for Mission Control

---

## 1. Revenue Module (`cc revenue`)

**Purpose**: Revenue tracking, financial forecasting, and pricing strategy

### Commands

#### `cc revenue summary`
Display revenue summary by time period.

**Syntax**:
```bash
cc revenue summary [--period <daily|weekly|monthly>]
```

**Arguments**:
- `--period, -p` (optional): Time period for aggregation
  - Values: `daily`, `weekly`, `monthly`
  - Default: `monthly`

**Usage**:
```bash
cc revenue summary                    # Monthly summary (default)
cc revenue summary --period weekly    # Weekly summary
cc revenue summary -p daily           # Daily summary
```

**Expected Output**: Tabular revenue metrics by period

**Error Handling**:
- Invalid period → Error message with valid options
- No revenue data → Empty summary with zero values

---

#### `cc revenue forecast`
AI-powered revenue forecast based on current MRR and growth patterns.

**Syntax**:
```bash
cc revenue forecast [--months <integer>]
```

**Arguments**:
- `--months, -m` (optional): Number of months to forecast
  - Type: INTEGER
  - Default: `6`
  - Range: 1-36 recommended

**Usage**:
```bash
cc revenue forecast                   # 6-month forecast (default)
cc revenue forecast --months 12       # 12-month forecast
cc revenue forecast -m 24             # 24-month forecast
```

**Expected Output**: AI-generated revenue projections with growth trends

**Error Handling**:
- Invalid months → Error: "months must be integer"
- No historical data → Warning: "Forecast may be inaccurate"

---

#### `cc revenue affiliates`
Display affiliate commission report.

**Syntax**:
```bash
cc revenue affiliates
```

**Arguments**: None

**Usage**:
```bash
cc revenue affiliates                 # Show affiliate commissions
```

**Expected Output**: Affiliate performance and commission summary

---

#### `cc revenue export`
Export revenue data to CSV.

**Syntax**:
```bash
cc revenue export [--output <filepath>]
```

**Arguments**:
- `--output, -o` (optional): Output file path
  - Type: STRING (filepath)
  - Default: `revenue_export_<timestamp>.csv`

**Usage**:
```bash
cc revenue export                              # Auto-named CSV
cc revenue export --output revenue_2026.csv    # Custom filename
```

**Expected Output**: CSV file with revenue records

---

## 2. Sales Module (`cc sales`)

**Purpose**: Sales pipeline management, lead tracking, CRM-lite operations

### Commands

#### `cc sales pipeline`
Show sales pipeline with stage distribution.

**Syntax**:
```bash
cc sales pipeline
```

**Arguments**: None

**Usage**:
```bash
cc sales pipeline                     # Show pipeline overview
```

**Expected Output**: Pipeline stages (Lead → Qualified → Proposal → Closed) with deal counts and values

**Error Handling**:
- No deals → Empty pipeline message
- Database connection error → Connection error message

---

#### `cc sales leads`
Manage leads (add, list, update, qualify).

**Syntax**:
```bash
cc sales leads <subcommand> [options]
```

**Subcommands**:
- `list`: List all leads
- `add`: Add new lead
- `update`: Update lead status
- `qualify`: Qualify lead for pipeline

**Usage**:
```bash
cc sales leads list                           # List all leads
cc sales leads add "Acme Corp" --email acme@example.com
cc sales leads update LEAD123 --status qualified
cc sales leads qualify LEAD456                # Move to pipeline
```

**Expected Output**: Lead records with status, contact info, and timestamps

---

#### `cc sales forecast`
Revenue forecast based on pipeline.

**Syntax**:
```bash
cc sales forecast [--probability <float>]
```

**Arguments**:
- `--probability` (optional): Win probability multiplier
  - Type: FLOAT
  - Default: `0.3` (30% close rate)
  - Range: 0.0-1.0

**Usage**:
```bash
cc sales forecast                             # Default 30% probability
cc sales forecast --probability 0.5           # 50% close rate
```

**Expected Output**: Projected revenue based on pipeline × probability

---

#### `cc sales report`
Generate sales reports.

**Syntax**:
```bash
cc sales report [--format <json|csv|table>]
```

**Arguments**:
- `--format` (optional): Output format
  - Values: `json`, `csv`, `table`
  - Default: `table`

**Usage**:
```bash
cc sales report                               # Table format
cc sales report --format json                 # JSON output
cc sales report --format csv                  # CSV export
```

**Expected Output**: Sales metrics (closed deals, revenue, conversion rates)

---

## 3. Content Module (`cc content`)

**Purpose**: AI-powered content generation, scheduling, and publishing

### Commands

#### `cc content ideas`
Generate content ideas with AI.

**Syntax**:
```bash
cc content ideas [--pillar <string>] [--count <integer>]
```

**Arguments**:
- `--pillar` (optional): Content pillar/category
  - Type: STRING
  - Examples: `tutorials`, `case-studies`, `thought-leadership`
- `--count` (optional): Number of ideas to generate
  - Type: INTEGER
  - Default: `5`

**Usage**:
```bash
cc content ideas                              # Generate 5 ideas
cc content ideas --pillar tutorials           # Ideas for tutorials
cc content ideas --count 10                   # Generate 10 ideas
```

**Expected Output**: Numbered list of AI-generated content ideas with brief descriptions

**Error Handling**:
- AI API failure → Fallback to template-based ideas
- Invalid count → Default to 5

---

#### `cc content draft`
Draft content with AI.

**Syntax**:
```bash
cc content draft "<topic>" [--type <type>] [--tone <tone>] [--length <length>]
```

**Arguments**:
- `topic` (required): Content topic/title
  - Type: STRING (quoted if contains spaces)
- `--type` (optional): Content type
  - Values: `article`, `tweet`, `linkedin_post`, `video_script`
  - Default: `article`
- `--tone` (optional): Content tone
  - Values: `professional`, `casual`, `technical`, `friendly`
  - Default: `professional`
- `--length` (optional): Content length
  - Values: `short`, `medium`, `long`
  - Default: `medium`

**Usage**:
```bash
cc content draft "API Best Practices"                         # Default: article, professional, medium
cc content draft "10 Tips" --type tweet --tone casual         # Casual tweet
cc content draft "Tech Tutorial" --type article --length long # Long article
```

**Expected Output**: AI-generated content draft saved to `drafts/` directory

**Error Handling**:
- AI quota exceeded → Error with retry suggestion
- Invalid type/tone/length → Error with valid options

---

#### `cc content calendar`
Show content calendar.

**Syntax**:
```bash
cc content calendar [--days <integer>]
```

**Arguments**:
- `--days` (optional): Days to display
  - Type: INTEGER
  - Default: `30`

**Usage**:
```bash
cc content calendar                           # Next 30 days
cc content calendar --days 7                  # Next week
cc content calendar --days 90                 # Next 3 months
```

**Expected Output**: Calendar view with scheduled content items

---

#### `cc content schedule`
Schedule content for publishing.

**Syntax**:
```bash
cc content schedule <content_id> "<datetime>"
```

**Arguments**:
- `content_id` (required): Content item ID
  - Type: INTEGER or STRING
- `datetime` (required): Publish datetime
  - Format: `YYYY-MM-DD HH:MM` (24-hour)
  - Example: `2026-01-26 10:00`

**Usage**:
```bash
cc content schedule 1 "2026-01-26 10:00"      # Schedule ID 1 for Jan 26
cc content schedule draft-123 "2026-02-01 14:30"
```

**Expected Output**: Confirmation with scheduled publish time

**Error Handling**:
- Invalid datetime → Error with format example
- Content not found → Error: "Content ID not found"
- Past datetime → Error: "Cannot schedule in the past"

---

#### `cc content publish`
Publish content to platforms.

**Syntax**:
```bash
cc content publish <content_id> [--platforms <list>]
```

**Arguments**:
- `content_id` (required): Content item ID
- `--platforms` (optional): Comma-separated platform list
  - Values: `twitter`, `linkedin`, `medium`, `devto`, `blog`
  - Default: All configured platforms

**Usage**:
```bash
cc content publish 1                                      # Publish to all platforms
cc content publish 1 --platforms twitter,linkedin         # Specific platforms
cc content publish draft-456 --platforms blog             # Blog only
```

**Expected Output**: Per-platform publish status (success/failure with URLs)

**Error Handling**:
- Platform API error → Error with platform name and retry suggestion
- Invalid platform → Error with valid platform list

---

#### `cc content list`
List content items.

**Syntax**:
```bash
cc content list [--status <status>]
```

**Arguments**:
- `--status` (optional): Filter by status
  - Values: `draft`, `scheduled`, `published`

**Usage**:
```bash
cc content list                               # All content
cc content list --status draft                # Drafts only
cc content list --status scheduled            # Scheduled content
```

**Expected Output**: Tabular list with ID, title, status, publish date

---

## 4. Agent Module (`cc agent`)

**Purpose**: AI agent swarm orchestration and management

### Commands

#### `cc agent spawn`
Spawn a new AI agent.

**Syntax**:
```bash
cc agent spawn <type> [--metadata <json>]
```

**Arguments**:
- `type` (required): Agent type
  - Values: `content`, `sales`, `support`, `research`, `dev`
- `--metadata` (optional): Agent metadata as JSON
  - Type: JSON STRING
  - Example: `'{"campaign": "Q1", "priority": "high"}'`

**Usage**:
```bash
cc agent spawn content                                    # Spawn content agent
cc agent spawn sales --metadata '{"campaign": "Q1"}'      # Sales agent with metadata
cc agent spawn support --metadata '{"tier": "premium"}'   # Support agent
```

**Expected Output**: Agent ID, type, status, spawn timestamp

**Error Handling**:
- Invalid agent type → Error with valid types
- Malformed JSON → JSON parse error
- Max agents reached → Error: "Agent limit reached"

---

#### `cc agent status`
Show agent status.

**Syntax**:
```bash
cc agent status [--filter <status>]
```

**Arguments**:
- `--filter` (optional): Filter by status
  - Values: `running`, `idle`, `stopped`, `error`

**Usage**:
```bash
cc agent status                               # All agents
cc agent status --filter running              # Running agents only
cc agent status --filter error                # Error agents
```

**Expected Output**: Tabular view with Agent ID, Type, Status, Uptime, Last Activity

---

#### `cc agent kill`
Terminate an agent.

**Syntax**:
```bash
cc agent kill <agent_id>
```

**Arguments**:
- `agent_id` (required): Agent identifier
  - Type: STRING
  - Format: `agent-<uuid>`

**Usage**:
```bash
cc agent kill agent-abc123                    # Kill specific agent
```

**Expected Output**: Termination confirmation with cleanup status

**Error Handling**:
- Agent not found → Error: "Agent ID not found"
- Agent already stopped → Warning: "Agent already terminated"

---

#### `cc agent swarm`
Swarm operations (deploy, scale, monitor).

**Syntax**:
```bash
cc agent swarm <subcommand> [options]
```

**Subcommands**:
- `deploy`: Deploy swarm from config
- `scale`: Scale swarm size
- `monitor`: Monitor swarm health

**Usage**:
```bash
cc agent swarm deploy config/swarm.yaml       # Deploy from YAML
cc agent swarm scale --count 5                # Scale to 5 agents
cc agent swarm monitor                        # Monitor health
```

**Expected Output**: Swarm status with agent distribution and health metrics

---

#### `cc agent logs`
Stream agent logs.

**Syntax**:
```bash
cc agent logs <agent_id> [--follow]
```

**Arguments**:
- `agent_id` (required): Agent identifier
- `--follow` (optional): Tail logs in real-time (like `tail -f`)
  - Type: FLAG (boolean)

**Usage**:
```bash
cc agent logs agent-abc123                    # Show recent logs
cc agent logs agent-abc123 --follow           # Tail logs (Ctrl+C to stop)
```

**Expected Output**: Timestamped log entries from agent

---

## 5. DevOps Module (`cc devops`)

**Purpose**: Deployment, monitoring, backup, and log management

### Commands

#### `cc devops deploy`
Deployment commands.

**Syntax**:
```bash
cc devops deploy [--env <environment>] [--service <service>]
```

**Arguments**:
- `--env` (optional): Target environment
  - Values: `development`, `staging`, `production`
  - Default: `staging`
- `--service` (optional): Service name to deploy
  - Values: `api`, `web`, `workers`, `all`
  - Default: `all`

**Usage**:
```bash
cc devops deploy                                      # Deploy all to staging
cc devops deploy --env production --service api       # Deploy API to production
cc devops deploy --env staging                        # Deploy all to staging
```

**Expected Output**: Deployment progress, status, and service URLs

**Error Handling**:
- Build failure → Error with build logs
- Health check failure → Rollback triggered
- Permission denied → Auth error message

---

#### `cc devops monitor`
Monitoring commands.

**Syntax**:
```bash
cc devops monitor [--service <service>] [--interval <seconds>]
```

**Arguments**:
- `--service` (optional): Service to monitor
  - Default: `all`
- `--interval` (optional): Refresh interval in seconds
  - Type: INTEGER
  - Default: `5`

**Usage**:
```bash
cc devops monitor                             # Monitor all services
cc devops monitor --service api               # Monitor API only
cc devops monitor --interval 2                # 2-second refresh
```

**Expected Output**: Real-time service health metrics (CPU, memory, requests/sec)

---

#### `cc devops backup`
Backup commands.

**Syntax**:
```bash
cc devops backup [--target <database|files|all>] [--destination <path>]
```

**Arguments**:
- `--target` (optional): Backup target
  - Values: `database`, `files`, `all`
  - Default: `all`
- `--destination` (optional): Backup destination path
  - Type: STRING (path or S3 URI)

**Usage**:
```bash
cc devops backup                                      # Backup all to default location
cc devops backup --target database                    # Database only
cc devops backup --destination s3://backups/daily/    # Custom S3 destination
```

**Expected Output**: Backup completion status with file size and location

---

#### `cc devops logs`
Log management commands.

**Syntax**:
```bash
cc devops logs [--service <service>] [--level <level>] [--follow]
```

**Arguments**:
- `--service` (optional): Service name
- `--level` (optional): Log level filter
  - Values: `debug`, `info`, `warning`, `error`, `critical`
- `--follow` (optional): Tail logs in real-time

**Usage**:
```bash
cc devops logs --service api --level error    # API errors only
cc devops logs --follow                       # Tail all logs
```

**Expected Output**: Timestamped log entries with level and message

---

## 6. Client Module (`cc client`)

**Purpose**: Client management, CRM, invoicing, portal access

### Commands

#### `cc client add`
Onboard a new client.

**Syntax**:
```bash
cc client add "<name>" --email <email> [--company <company>] [--retainer <amount>]
```

**Arguments**:
- `name` (required): Client name
  - Type: STRING (quoted if contains spaces)
- `--email, -e` (required): Client email address
  - Type: EMAIL STRING
- `--company, -c` (optional): Client company name
  - Type: STRING
- `--retainer, -r` (optional): Monthly retainer amount
  - Type: FLOAT
  - Default: `2000.0`

**Usage**:
```bash
cc client add "John Doe" --email john@example.com                     # Default $2000 retainer
cc client add "Jane Smith" -e jane@startup.com --company "Startup Inc" --retainer 5000
cc client add "Acme Corp" -e contact@acme.com -c "Acme" -r 10000
```

**Expected Output**: Client ID, portal link, onboarding confirmation

**Error Handling**:
- Invalid email → Email validation error
- Duplicate email → Error: "Client already exists"
- Invalid retainer → Error: "Retainer must be positive number"

---

#### `cc client list`
List all clients with their status.

**Syntax**:
```bash
cc client list [--status <status>]
```

**Arguments**:
- `--status` (optional): Filter by status
  - Values: `active`, `inactive`, `paused`, `all`
  - Default: `active`

**Usage**:
```bash
cc client list                                # Active clients
cc client list --status all                   # All clients
cc client list --status paused                # Paused clients
```

**Expected Output**: Tabular client list with ID, Name, Email, Retainer, Status, Total Spent

---

#### `cc client invoice`
Create an invoice for a client.

**Syntax**:
```bash
cc client invoice <client_id> <amount> [--description <text>] [--due-days <days>]
```

**Arguments**:
- `client_id` (required): Client identifier
  - Type: STRING (Client ID or UUID)
- `amount` (required): Invoice amount
  - Type: FLOAT
- `--description, -d` (optional): Invoice description
  - Type: STRING
  - Default: `"Service Fee"`
- `--due-days` (optional): Days until due
  - Type: INTEGER
  - Default: `30`

**Usage**:
```bash
cc client invoice CLIENT123 2500                              # $2500 invoice, 30-day terms
cc client invoice CLIENT456 5000 --description "Q1 Retainer" --due-days 15
cc client invoice UUID-789 1200 -d "Additional Services" --due-days 7
```

**Expected Output**: Invoice ID, PDF link, due date, client notification status

**Error Handling**:
- Client not found → Error: "Client ID not found"
- Invalid amount → Error: "Amount must be positive"
- Negative due-days → Error: "Due days must be positive"

---

#### `cc client portal`
Generate client portal link.

**Syntax**:
```bash
cc client portal <client_id> [--expires <hours>]
```

**Arguments**:
- `client_id` (required): Client identifier
- `--expires` (optional): Link expiration in hours
  - Type: INTEGER
  - Default: `24`

**Usage**:
```bash
cc client portal CLIENT123                    # 24-hour portal link
cc client portal CLIENT456 --expires 72       # 72-hour link
```

**Expected Output**: Secure portal URL with expiration timestamp

---

#### `cc client status`
Show client health/status report.

**Syntax**:
```bash
cc client status <client_id>
```

**Arguments**:
- `client_id` (required): Client identifier

**Usage**:
```bash
cc client status CLIENT123                    # Health report for CLIENT123
```

**Expected Output**: Client health metrics (payment status, engagement, outstanding invoices, LTV)

---

## 7. Release Module (`cc release`)

**Purpose**: Release automation, versioning, deployment

### Commands

#### `cc release create`
Create a new release.

**Syntax**:
```bash
cc release create <version> [--changelog <text>]
```

**Arguments**:
- `version` (required): Semantic version number
  - Format: `MAJOR.MINOR.PATCH` (e.g., `1.0.0`)
- `--changelog` (optional): Changelog text
  - Type: STRING (quoted if multi-line)

**Usage**:
```bash
cc release create 1.0.0                                   # Create v1.0.0
cc release create 2.1.0 --changelog "New features..."     # With changelog
cc release create 1.0.1 --changelog "Bug fixes"           # Patch release
```

**Expected Output**: Release tag, changelog, build artifacts

**Error Handling**:
- Invalid version format → Error: "Version must be MAJOR.MINOR.PATCH"
- Version already exists → Error: "Version v1.0.0 already exists"

---

#### `cc release build`
Build Docker image and Python package.

**Syntax**:
```bash
cc release build [--no-cache]
```

**Arguments**:
- `--no-cache` (optional): Disable Docker build cache
  - Type: FLAG (boolean)

**Usage**:
```bash
cc release build                              # Build with cache
cc release build --no-cache                   # Clean build
```

**Expected Output**: Docker image ID, Python package wheel file

---

#### `cc release publish`
Publish to registries (Docker Hub, PyPI).

**Syntax**:
```bash
cc release publish [--registry <docker|pypi|all>]
```

**Arguments**:
- `--registry` (optional): Target registry
  - Values: `docker`, `pypi`, `all`
  - Default: `all`

**Usage**:
```bash
cc release publish                            # Publish to all registries
cc release publish --registry docker          # Docker Hub only
cc release publish --registry pypi            # PyPI only
```

**Expected Output**: Registry URLs for published artifacts

---

#### `cc release deploy`
Deploy to environment.

**Syntax**:
```bash
cc release deploy <environment>
```

**Arguments**:
- `environment` (required): Target environment
  - Values: `staging`, `production`

**Usage**:
```bash
cc release deploy staging                     # Deploy to staging
cc release deploy production                  # Deploy to production
```

**Expected Output**: Deployment status, service URLs, health check results

---

#### `cc release rollback`
Rollback to previous version.

**Syntax**:
```bash
cc release rollback [--version <version>]
```

**Arguments**:
- `--version` (optional): Specific version to rollback to
  - Format: `MAJOR.MINOR.PATCH`
  - Default: Previous version

**Usage**:
```bash
cc release rollback                           # Rollback to previous version
cc release rollback --version 1.0.0           # Rollback to specific version
```

**Expected Output**: Rollback confirmation, deployed version

---

## 8. Analytics Module (`cc analytics`)

**Purpose**: Business metrics dashboard, funnel analysis, cohort tracking

### Commands

#### `cc analytics dashboard`
Show key business metrics dashboard.

**Syntax**:
```bash
cc analytics dashboard [--refresh <seconds>]
```

**Arguments**:
- `--refresh` (optional): Auto-refresh interval in seconds
  - Type: INTEGER
  - Default: No auto-refresh (one-time display)

**Usage**:
```bash
cc analytics dashboard                        # One-time dashboard
cc analytics dashboard --refresh 10           # Auto-refresh every 10s
```

**Expected Output**: Dashboard with MRR, ARR, user count, revenue trends, conversion rates

---

#### `cc analytics funnel`
Conversion funnel analysis.

**Syntax**:
```bash
cc analytics funnel [--start <date>] [--end <date>]
```

**Arguments**:
- `--start` (optional): Start date for analysis
  - Format: `YYYY-MM-DD`
  - Default: 30 days ago
- `--end` (optional): End date for analysis
  - Format: `YYYY-MM-DD`
  - Default: Today

**Usage**:
```bash
cc analytics funnel                                   # Last 30 days
cc analytics funnel --start 2026-01-01 --end 2026-01-31
cc analytics funnel --start 2025-12-01                # Dec 1 to today
```

**Expected Output**: Funnel stages with conversion rates (Visitor → Lead → Trial → Paid)

---

#### `cc analytics cohort`
Cohort retention analysis.

**Syntax**:
```bash
cc analytics cohort [--months <count>]
```

**Arguments**:
- `--months` (optional): Number of months to analyze
  - Type: INTEGER
  - Default: `6`

**Usage**:
```bash
cc analytics cohort                           # 6-month cohorts
cc analytics cohort --months 12               # 12-month cohorts
cc analytics cohort --months 3                # 3-month cohorts
```

**Expected Output**: Cohort retention matrix with month-over-month percentages

---

#### `cc analytics realtime`
Live metrics stream (Ctrl+C to stop).

**Syntax**:
```bash
cc analytics realtime [--interval <seconds>]
```

**Arguments**:
- `--interval` (optional): Update interval in seconds
  - Type: INTEGER
  - Default: `2`

**Usage**:
```bash
cc analytics realtime                         # 2-second updates
cc analytics realtime --interval 5            # 5-second updates
```

**Expected Output**: Streaming real-time metrics (active users, requests/sec, errors/sec)

---

#### `cc analytics export`
Export analytics data to CSV.

**Syntax**:
```bash
cc analytics export [--output <filepath>] [--start <date>] [--end <date>]
```

**Arguments**:
- `--output` (optional): Output file path
  - Type: STRING (filepath)
  - Default: `analytics_export_<timestamp>.csv`
- `--start` (optional): Start date
  - Format: `YYYY-MM-DD`
- `--end` (optional): End date
  - Format: `YYYY-MM-DD`

**Usage**:
```bash
cc analytics export                                   # All data to auto-named CSV
cc analytics export --output metrics_q1.csv --start 2026-01-01 --end 2026-03-31
```

**Expected Output**: CSV file with analytics records

---

## 9. Monitor Module (`cc monitor`)

**Purpose**: System monitoring, health checks, alerts, uptime tracking

### Commands

#### `cc monitor health`
Run system health check.

**Syntax**:
```bash
cc monitor health
```

**Arguments**: None

**Usage**:
```bash
cc monitor health                             # Check system health
```

**Expected Output**: Health status for all services (API, database, cache, queues) with response times

**Error Handling**:
- Service unreachable → Error status with last known state
- Timeout → Warning with partial results

---

#### `cc monitor alerts`
Show recent alerts.

**Syntax**:
```bash
cc monitor alerts [--limit <count>] [--severity <level>]
```

**Arguments**:
- `--limit` (optional): Number of alerts to show
  - Type: INTEGER
  - Default: `10`
- `--severity` (optional): Filter by severity
  - Values: `critical`, `warning`, `info`

**Usage**:
```bash
cc monitor alerts                             # Latest 10 alerts
cc monitor alerts --limit 20                  # Latest 20 alerts
cc monitor alerts --severity critical         # Critical alerts only
```

**Expected Output**: Alert list with timestamp, severity, service, message

---

#### `cc monitor logs`
View system logs.

**Syntax**:
```bash
cc monitor logs <subcommand> [options]
```

**Subcommands**:
- `tail`: Tail logs (like `tail -f`)
- `search`: Search logs by pattern

**Usage**:
```bash
cc monitor logs tail --lines 100 --follow     # Tail last 100 lines
cc monitor logs search "error" --since 1h     # Search errors from last hour
```

**Expected Output**: Timestamped log entries

---

#### `cc monitor metrics`
Show performance metrics.

**Syntax**:
```bash
cc monitor metrics [--interval <seconds>]
```

**Arguments**:
- `--interval` (optional): Refresh interval in seconds
  - Type: INTEGER
  - Default: One-time display (no refresh)

**Usage**:
```bash
cc monitor metrics                            # One-time metrics
cc monitor metrics --interval 5               # Auto-refresh every 5s
```

**Expected Output**: CPU, memory, disk, network metrics

---

#### `cc monitor uptime`
Show uptime report.

**Syntax**:
```bash
cc monitor uptime [--days <count>]
```

**Arguments**:
- `--days` (optional): Number of days to report
  - Type: INTEGER
  - Default: `30`

**Usage**:
```bash
cc monitor uptime                             # 30-day uptime
cc monitor uptime --days 7                    # Weekly uptime
cc monitor uptime --days 90                   # Quarterly uptime
```

**Expected Output**: Uptime percentage, downtime incidents, MTTR (Mean Time To Recover)

---

## Common Workflows for AI Agents

### 1. Client Onboarding → Invoice Flow
```bash
# Step 1: Add client
cc client add "Acme Corp" --email contact@acme.com --company "Acme Inc" --retainer 5000

# Step 2: Generate portal link
cc client portal CLIENT123

# Step 3: Create first invoice
cc client invoice CLIENT123 5000 --description "January Retainer" --due-days 15

# Step 4: Check client status
cc client status CLIENT123
```

### 2. Content Creation → Publishing Flow
```bash
# Step 1: Generate ideas
cc content ideas --pillar tutorials --count 5

# Step 2: Draft content
cc content draft "API Best Practices" --type article --tone technical --length long

# Step 3: Schedule for publishing
cc content schedule 1 "2026-01-27 09:00"

# Step 4: Publish to platforms
cc content publish 1 --platforms twitter,linkedin,medium
```

### 3. Release → Deploy → Monitor Flow
```bash
# Step 1: Create release
cc release create 1.5.0 --changelog "New features: X, Y, Z"

# Step 2: Build artifacts
cc release build

# Step 3: Deploy to staging
cc release deploy staging

# Step 4: Monitor health
cc monitor health

# Step 5: Deploy to production
cc release deploy production

# Step 6: Monitor metrics
cc monitor metrics --interval 5
```

### 4. Sales Pipeline Management
```bash
# Step 1: View pipeline
cc sales pipeline

# Step 2: Add new lead
cc sales leads add "New Prospect" --email prospect@example.com

# Step 3: Qualify lead
cc sales leads qualify LEAD123

# Step 4: Forecast revenue
cc sales forecast --probability 0.4

# Step 5: Generate report
cc sales report --format csv
```

### 5. Agent Swarm Deployment
```bash
# Step 1: Deploy swarm
cc agent swarm deploy config/swarm.yaml

# Step 2: Spawn additional agents
cc agent spawn content --metadata '{"campaign": "Q1"}'
cc agent spawn sales --metadata '{"priority": "high"}'

# Step 3: Monitor agents
cc agent status --filter running

# Step 4: View agent logs
cc agent logs agent-abc123 --follow
```

---

## Error Handling Patterns

### Common Exit Codes
- `0`: Success
- `1`: General error
- `2`: Missing required argument
- `3`: Invalid argument value
- `4`: Resource not found (client, content, agent, etc.)
- `5`: Permission denied
- `6`: API/service unavailable
- `7`: Database error
- `8`: File I/O error

### Error Response Format
All modules return errors in this format:

```json
{
  "error": {
    "code": 4,
    "message": "Client ID not found",
    "details": "CLIENT123 does not exist in database",
    "suggestion": "Run 'cc client list' to see available clients"
  }
}
```

### Retry Logic for AI Agents
```python
import subprocess
import time

def run_cc_command(cmd, max_retries=3):
    """Execute CC command with retry logic"""
    for attempt in range(max_retries):
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)

        if result.returncode == 0:
            return result.stdout

        # Retry on transient errors (exit codes 6, 7)
        if result.returncode in [6, 7]:
            time.sleep(2 ** attempt)  # Exponential backoff
            continue

        # Don't retry on permanent errors
        raise Exception(f"Command failed: {result.stderr}")

    raise Exception(f"Command failed after {max_retries} retries")

# Usage
output = run_cc_command("cc client list --status active")
```

---

## AI Agent Integration Examples

### 1. Autonomous Client Management
```python
# AI agent monitors inbox for new client signups, auto-onboards
def auto_onboard_client(email_data):
    name = email_data['name']
    email = email_data['email']
    company = email_data.get('company', '')

    # Onboard client
    result = run_cc_command(f'cc client add "{name}" --email {email} --company "{company}"')
    client_id = extract_client_id(result)

    # Generate portal link
    portal_link = run_cc_command(f'cc client portal {client_id}')

    # Send welcome email with portal link
    send_email(email, f"Welcome! Your portal: {portal_link}")

    return client_id
```

### 2. Autonomous Content Publishing
```python
# AI agent generates, schedules, and publishes content autonomously
def autonomous_content_pipeline(pillar, publish_datetime):
    # Generate ideas
    ideas = run_cc_command(f'cc content ideas --pillar {pillar} --count 3')
    best_idea = select_best_idea(ideas)  # AI decision

    # Draft content
    draft = run_cc_command(f'cc content draft "{best_idea}" --type article --tone professional')
    content_id = extract_content_id(draft)

    # Schedule
    run_cc_command(f'cc content schedule {content_id} "{publish_datetime}"')

    # Auto-publish (executed by scheduler)
    run_cc_command(f'cc content publish {content_id} --platforms twitter,linkedin')
```

### 3. Autonomous Deployment Pipeline
```python
# AI agent monitors codebase, auto-deploys on merge to main
def auto_deploy_on_merge(branch, version):
    if branch != 'main':
        return

    # Create release
    changelog = generate_changelog()  # AI-generated
    run_cc_command(f'cc release create {version} --changelog "{changelog}"')

    # Build
    run_cc_command('cc release build')

    # Deploy to staging
    run_cc_command('cc release deploy staging')

    # Health check
    health = run_cc_command('cc monitor health')
    if not is_healthy(health):
        run_cc_command(f'cc release rollback')
        raise Exception("Health check failed, rolled back")

    # Deploy to production
    run_cc_command('cc release deploy production')
```

---

## Version Information
- **CC CLI Version**: 2.0.0 (from package.json)
- **Last Updated**: 2026-01-25
- **Modules**: 9 (revenue, sales, content, agent, devops, client, release, analytics, monitor)

---

## Additional Resources
- **Repository**: https://github.com/binhphap/mekong-cli
- **Documentation**: `./docs/`
- **Examples**: `./examples/`
- **Support**: Open issue on GitHub

---

**AI Agent Notes**:
- All commands support `--help` for detailed usage
- JSON output available for most commands (use `--format json` or pipe to `jq`)
- Exit codes are consistent across all modules
- Error messages include actionable suggestions
- Commands are idempotent where possible (safe to retry)

---

## 🔀 Quick Reference - All Entry Points

Agency OS supports multiple command entry points for different workflows:

| Entry Point | Primary Use | Status |
|-------------|-------------|--------|
| `cc <module>` | Modern module-based commands | ✅ **Primary** |
| `/<command>` | Quick shortcuts for common tasks | 🟡 **Legacy** |
| `mekong <command>` | Vietnamese cultural commands | 🟡 **Legacy** |

**Recommendation**: Use `cc` commands for new workflows. Legacy commands are preserved for backward compatibility.

---

## 📜 Slash Commands (Legacy)

> **Status**: Legacy shortcuts maintained for backward compatibility
>
> **Migration Path**: Each slash command has a modern `cc` equivalent (shown below)

Slash commands provide quick access to common workflows:

### `/cook` - Build Features with AI

**Description**: Delegate feature implementation to AI Dev (fullstack developer agent)

**Usage**:
```bash
/cook "Build a landing page for Spa SEO service using Next.js and Tailwind"
/cook "Add user authentication with JWT"
/cook "Create dashboard with revenue charts"
```

**What it does**:
1. **Plan**: Creates implementation plan with 3-phase breakdown
2. **Code**: Writes React/Next.js/Python code following standards
3. **Test**: Runs automated tests and validates

**Modern Equivalent**:
```bash
cc agent spawn --type coder --task "Build a landing page..."
# OR
cc workflow implement "Build a landing page..."
```

**Deprecation Status**: 🟡 Maintained for backward compatibility

---

### `/quote` - Generate Pricing Quotes

**Description**: Generate pricing quotes using Binh Pháp (13 Chapters) strategy

**Usage**:
```bash
/quote "Lotus Spa" --budget 5000
/quote "TechStartup" --budget 50000 --tier enterprise
/quote "Local Business" --budget 2000 --model retainer
```

**Arguments**:
- `client_name` (required): Client or project name
- `--budget` (optional): Budget in USD
- `--tier` (optional): warrior | general | tuong-quan (auto-detected if omitted)
- `--model` (optional): retainer | project | hybrid

**Output**: Generates PDF quote with:
- Service breakdown by Binh Pháp chapters
- WIN-WIN-WIN alignment score
- Payment terms and milestones

**Modern Equivalent**:
```bash
cc sales quote "Lotus Spa" --budget 5000
cc revenue calculate-quote "Lotus Spa" --budget 5000
```

**Deprecation Status**: 🟡 Maintained for backward compatibility

---

### `/win3` - Validate WIN-WIN-WIN Alignment

**Description**: Check if a deal/strategy benefits all three parties (Owner, Agency, Client)

**Usage**:
```bash
/win3                          # Check current proposal
/win3 --deal "Lotus Spa"       # Check specific deal
/win3 --strategy "Series A"    # Check funding strategy
```

**Output**:
```
┌───────────────────────────────────────────────────┐
│  👑 ANH (Owner) WIN: +15% equity value            │
│  🏢 AGENCY WIN: +$5K MRR, reusable assets        │
│  🚀 CLIENT WIN: 3x faster GTM, anti-dilution      │
│                                                   │
│  ✅ Score: 85/100 - PROCEED                      │
└───────────────────────────────────────────────────┘
```

**Scoring**:
- **90-100**: Excellent alignment, proceed immediately
- **70-89**: Good, minor adjustments recommended
- **50-69**: Risky, renegotiate terms
- **<50**: ❌ STOP - someone loses

**Modern Equivalent**:
```bash
cc strategy validate-win --deal "Lotus Spa"
# OR
cc binh-phap validate-win
```

**Deprecation Status**: 🟡 Maintained for backward compatibility

---

### `/proposal` - Generate Client Proposals

**Description**: Auto-generate professional proposal documents

**Usage**:
```bash
/proposal "Lotus Spa"
/proposal "TechStartup" --template enterprise
/proposal "Local Business" --format pdf
```

**Arguments**:
- `client_name` (required): Client or project name
- `--template` (optional): standard | enterprise | startup
- `--format` (optional): pdf | docx | markdown

**Output**: Generates proposal with:
- Executive summary
- Scope of work (aligned with quote)
- Timeline and milestones
- Team composition
- Terms and conditions

**Modern Equivalent**:
```bash
cc sales proposal "Lotus Spa"
cc content generate-proposal "Lotus Spa"
```

**Deprecation Status**: 🟡 Maintained for backward compatibility

---

### `/antigravity` - Master Dashboard

**Description**: View comprehensive agency dashboard (revenue, moat, AI agents status)

**Usage**:
```bash
/antigravity                   # Full dashboard
/antigravity --section revenue # Specific section
/antigravity --refresh         # Force refresh metrics
```

**Dashboard Sections**:
1. **💰 Revenue**: MRR, ARR, progress to $1M target
2. **🏰 Moat**: Competitive advantage strength (0-100)
3. **🤖 AI Agents**: Status of all active agents
4. **📊 Pipeline**: Sales pipeline health
5. **⚡ Velocity**: Development & deployment speed

**Modern Equivalent**:
```bash
cc analytics dashboard
cc monitor status --comprehensive
cc revenue dashboard
```

**Deprecation Status**: 🟡 Maintained for backward compatibility

---

### `/help` - View All Commands

**Description**: Display all available commands across all modules

**Usage**:
```bash
/help                          # All commands
/help revenue                  # Revenue module help
/help --search "invoice"       # Search commands
```

**Modern Equivalent**:
```bash
cc --help
cc revenue --help
```

**Deprecation Status**: ✅ Permanent (standard help command)

---

### `/jules` - Weekend Code Cleanup

**Description**: Automated code maintenance (remove dead code, optimize, refactor)

**Usage**:
```bash
/jules                         # Full cleanup
/jules --quick                 # Quick scan only
/jules --aggressive            # Deep refactoring
```

**What it does**:
- Removes unused imports and variables
- Optimizes database queries
- Refactors duplicate code
- Updates dependencies
- Runs linting and formatting

**Modern Equivalent**:
```bash
cc devops cleanup
cc agent spawn --type refactoring-specialist
```

**Deprecation Status**: 🟡 Maintained for backward compatibility

---

## 🏯 Mekong Commands (Binh Pháp - Cultural)

> **Status**: Vietnamese cultural commands preserving Agency OS heritage
>
> **Philosophy**: "Binh Pháp" (兵法) - The Art of War applied to business

These commands reflect Vietnamese naming and Binh Pháp strategic philosophy:

### `mekong init` - Initialize Agency DNA

**Description**: Bootstrap agency identity and configuration

**Usage**:
```bash
mekong init "Alpha Digital"
mekong init "VietStartup Agency" --niche saas --model hybrid
```

**Arguments**:
- `agency_name` (required): Your agency name
- `--niche` (optional): spa | real-estate | saas | ecommerce
- `--model` (optional): retainer | project | hybrid
- `--goal` (optional): Revenue goal (e.g., "10k/month", "1M ARR")

**Interactive Questions**:
1. **Niche (Thị trường ngách)**: Who do you serve?
2. **Model (Mô hình)**: Retainer, Project, or Hybrid?
3. **Goal (Mục tiêu)**: $10k/month or $1M ARR?

**What it creates**:
- `.agency/config.json` - Agency configuration
- `.agency/dna.md` - Brand identity and values
- `.agency/playbooks/` - Standard operating procedures

**Modern Equivalent**:
```bash
cc client init "Alpha Digital"
# OR
cc agent onboard --type agency-setup
```

**Deprecation Status**: 🟡 Maintained for backward compatibility

---

### `mekong setup-vibe` - Configure Environment

**Description**: Set location and communication tone for AI agents

**Usage**:
```bash
mekong setup-vibe --location "Ho Chi Minh" --tone "Professional"
mekong setup-vibe --location "Singapore" --tone "Casual"
mekong setup-vibe --location "Bangkok" --tone "Friendly"
```

**Arguments**:
- `--location` (required): City/region for localization
- `--tone` (required): Professional | Casual | Friendly | Technical

**What it does**:
- Configures AI agent communication style
- Sets timezone and locale
- Adjusts pricing recommendations for local market
- Updates payment gateway preferences (PayOS for VN, Omise for TH, etc.)

**Configuration File**: `.agency/vibe.json`

**Modern Equivalent**:
```bash
cc agent configure-vibe --location "Ho Chi Minh" --tone "Professional"
# OR
cc devops set-environment --location "Ho Chi Minh"
```

**Deprecation Status**: 🟡 Maintained for backward compatibility

---

### `mekong run-scout` - Research and Scout

**Description**: AI-powered research and requirement analysis before implementation

**Usage**:
```bash
mekong run-scout "Landing page giới thiệu dịch vụ SEO cho Spa"
mekong run-scout "E-commerce platform for Vietnam market"
mekong run-scout "CRM system for real estate agency"
```

**What it does**:
1. **Market Research**: Analyzes competitors and market trends
2. **Technical Analysis**: Recommends tech stack
3. **Requirement Extraction**: Creates detailed specs
4. **Resource Estimation**: Calculates time and budget

**Output**: Creates research report in `./plans/research/scout-report-{timestamp}.md`

**Workflow**:
```bash
# 1. Scout first
mekong run-scout "Landing page for Spa SEO"

# 2. Then implement
/cook "Build a landing page for Spa SEO service using Next.js and Tailwind"
```

**Modern Equivalent**:
```bash
cc agent spawn --type researcher --task "Landing page for Spa SEO"
# OR
cc workflow scout "Landing page for Spa SEO"
```

**Deprecation Status**: 🟡 Maintained for backward compatibility

---

## 🔄 Command Migration Guide

For users transitioning from legacy commands to modern `cc` modules:

| Legacy Command | Modern Equivalent | Status |
|----------------|-------------------|--------|
| `/cook "task"` | `cc agent spawn --type coder --task "task"` | 🟡 Both work |
| `/quote "client"` | `cc sales quote "client"` | 🟡 Both work |
| `/win3` | `cc strategy validate-win` | 🟡 Both work |
| `/proposal "client"` | `cc sales proposal "client"` | 🟡 Both work |
| `/antigravity` | `cc analytics dashboard` | 🟡 Both work |
| `/help` | `cc --help` | ✅ Both work |
| `/jules` | `cc devops cleanup` | 🟡 Both work |
| `mekong init "name"` | `cc client init "name"` | 🟡 Both work |
| `mekong setup-vibe` | `cc agent configure-vibe` | 🟡 Both work |
| `mekong run-scout` | `cc workflow scout` | 🟡 Both work |

**Recommendation**: Start using `cc` commands for new workflows. Legacy commands will be maintained indefinitely for backward compatibility.
