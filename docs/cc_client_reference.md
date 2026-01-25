# cc_client CLI - Quick Reference

Client Management CLI for mekong-cli.

## Installation

The CLI is located at `scripts/cc_client.py` and uses Typer for command parsing.

## Usage

```bash
python3 scripts/cc_client.py [COMMAND] [OPTIONS]
```

## Commands

### 1. Add Client
Onboard a new client with portal access.

```bash
python3 scripts/cc_client.py add "Client Name" --email client@example.com
python3 scripts/cc_client.py add "John Doe" --email john@example.com --company "Acme Corp" --retainer 5000
```

**Options:**
- `--email, -e`: Client email (required)
- `--company, -c`: Company name (optional)
- `--retainer, -r`: Monthly retainer amount (default: $2000)

**Output:**
- Client ID
- Portal access code
- Account details

### 2. List Clients
Display all clients with their information.

```bash
python3 scripts/cc_client.py list
python3 scripts/cc_client.py list --status active
```

**Options:**
- `--status, -s`: Filter by status (active/inactive)

**Displays:**
- Client ID, name, email, company
- Status indicator (✓/✗)
- Monthly retainer and total spent
- Creation date

### 3. Generate Portal Link
Create secure portal access URL for a client.

```bash
python3 scripts/cc_client.py portal CLI-44ACDC37
```

**Output:**
- Client information
- Portal access code
- Shareable portal URL

### 4. Create Invoice
Generate invoice for a client.

```bash
python3 scripts/cc_client.py invoice CLI-44ACDC37 5000
python3 scripts/cc_client.py invoice CLI-44ACDC37 5000 --description "Website Phase 1" --due-days 15
```

**Options:**
- `--description, -d`: Invoice description (default: "Service Fee")
- `--due-days`: Days until due (default: 30)

**Output:**
- Invoice ID
- Amount and due date
- Draft status

### 5. Client Status
Show comprehensive client health report.

```bash
python3 scripts/cc_client.py status CLI-44ACDC37
```

**Displays:**
- Client information
- Financial overview (billed, paid, outstanding)
- Invoice summary (total, paid, draft, overdue)
- Health status indicator
- Recent invoices table

**Health Status:**
- 🟢 Healthy: No outstanding balance
- 🟡 Outstanding Balance: Unpaid invoices
- 🔴 Needs Attention: Overdue invoices

## Data Storage

All data is persisted in JSON format:
- Clients: `data/client_portal/clients.json`
- Invoices: `data/client_portal/invoices.json`

## Examples

```bash
# Onboard new client
python3 scripts/cc_client.py add "Alice Johnson" --email alice@startup.com --company "Startup Inc" --retainer 3500

# List all active clients
python3 scripts/cc_client.py list --status active

# Generate portal link
python3 scripts/cc_client.py portal CLI-ABC123

# Create invoice
python3 scripts/cc_client.py invoice CLI-ABC123 7500 --description "Q1 Development" --due-days 20

# Check client health
python3 scripts/cc_client.py status CLI-ABC123
```

## Features

- ✅ Secure client ID and portal code generation
- ✅ Rich terminal UI with colored output
- ✅ Comprehensive error handling
- ✅ JSON persistence for all data
- ✅ Financial tracking and health monitoring
- ✅ Invoice management with status tracking
- ✅ Filter and sort capabilities

## Task Completion

**TASK CC-CLIENT: COMPLETE** ✅

All required commands implemented and tested:
1. ✅ `add` - Client onboarding with email, company, retainer
2. ✅ `list` - Display all clients with status filtering
3. ✅ `portal` - Generate client portal links
4. ✅ `invoice` - Create invoices with custom amounts
5. ✅ `status` - Client health/status reports

All data persists correctly to JSON files.
