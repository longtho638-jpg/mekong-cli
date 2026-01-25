# CC Sales - Sales Automation CLI

CRM-lite for one-person agencies with pipeline management, lead tracking, and revenue forecasting.

## Installation

```bash
chmod +x scripts/cc_sales.py
alias cc='python3 scripts/cc_sales.py'
```

## Commands

### 1. Pipeline View
```bash
cc sales pipeline
```
Shows sales pipeline with all stages:
- 🔍 Lead
- ✓ Qualified
- 📄 Proposal
- 💬 Negotiation
- ✅ Closed Won
- ❌ Closed Lost

### 2. Add Leads
```bash
cc sales leads add "John Doe" --email john@example.com --company "Acme Corp" --value 10000
```

Options:
- `--email` (required): Contact email
- `--company`: Company name
- `--value`: Deal value (defaults to $5,000)
- `--source`: Lead source (default: "manual")

### 3. Follow-up Management
```bash
cc sales leads follow-up
```
Shows leads that need follow-up based on last contact date (default: 7 days).

### 4. Revenue Forecast
```bash
cc sales forecast
```
Shows:
- Weighted forecast by pipeline stage
- Simple forecast (pipeline × close rate)
- Best case scenario (100% close rate)

Stage weights:
- Lead: 10%
- Qualified: 30%
- Proposal: 50%
- Negotiation: 70%

### 5. Weekly Report
```bash
cc sales report weekly
```
Shows:
- New leads this week
- Closed deals this week
- Follow-up needed
- Pipeline status

## Data Storage

Sales data is stored in `~/.cc_sales.json`

Default settings:
- Follow-up threshold: 7 days
- Average deal value: $5,000
- Close rate: 30%

## Example Workflow

```bash
# Add new leads
cc sales leads add "Alice Johnson" --email alice@startup.io --company "Startup Inc" --value 12000
cc sales leads add "Bob Smith" --email bob@corp.com --company "Big Corp" --value 25000

# Check pipeline
cc sales pipeline

# Check who needs follow-up
cc sales leads follow-up

# See revenue forecast
cc sales forecast

# Weekly summary
cc sales report weekly
```

## Tips

- Leads automatically get a 3-day follow-up date when created
- After 7 days without contact, leads appear in follow-up list
- Pipeline value excludes closed-lost deals
- Forecast uses both weighted (by stage) and simple (by close rate) methods
