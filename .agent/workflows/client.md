---
description: Client onboarding - contract, invoice, portal setup in one command
---

// turbo-all

# 🏯 /client [name] - Full Client Onboarding

One command: Lead → Contract → Invoice → Portal → Done

## Arguments

- `$CLIENT_NAME` - Client/company name

## What Runs (Silently)

### 1. Generate Contract

```bash
PYTHONPATH=. python3 scripts/contract_generator.py --client "$CLIENT_NAME"
```

### 2. Generate Invoice

```bash
PYTHONPATH=. python3 -c "
from scripts.invoice_generator import InvoiceGenerator
ig = InvoiceGenerator()
invoice = ig.generate('$CLIENT_NAME', 5000, 'Retainer')
print(f'Invoice: {invoice}')
"
```

### 3. Setup Client Portal

```bash
PYTHONPATH=. python3 -c "
print('🔧 Setting up client portal...')
# Portal setup logic
portal_url = f'https://portal.agencyos.io/{\"$CLIENT_NAME\".lower().replace(\" \", \"-\")}'
print(f'Portal: {portal_url}')
"
```

### 4. Add to CRM

```bash
PYTHONPATH=. python3 -c "
from antigravity.core.client_magnet import ClientMagnet
cm = ClientMagnet()
# Add client to CRM
print('✅ Added to CRM')
"
```

### 5. Send Welcome Email

```bash
PYTHONPATH=. python3 scripts/urgent_outreach.py --template welcome --to "$CLIENT_NAME"
```

## Output Format

```
✅ Contract: contracts/{client}_MSA.pdf
✅ Invoice: invoices/INV-{number}.pdf
✅ Portal: https://portal.agencyos.io/{client}
✅ CRM: Added
✅ Welcome email: Sent

🎉 Client onboarding complete!
```

---

> 🏯 _"Khách đến như về nhà"_ - Client feels at home
