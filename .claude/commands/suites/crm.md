---
description: 🧲 CRM Suite - Leads, pipeline, contacts management
argument-hint: [:leads|:pipeline|:contacts|:add]
---

## Mission

Unified CRM command hub.

## Subcommands

| Command | Description | Core Module |
|---------|-------------|-------------|
| `/crm:leads` | View/manage leads | `crm.py` |
| `/crm:pipeline` | Sales pipeline | `crm.py` |
| `/crm:contacts` | Contact list | `client_magnet.py` |
| `/crm:add` | Add new contact | `crm.py` |

## Quick Examples

```bash
/crm                  # Show pipeline summary
/crm:leads            # List hot leads
/crm:pipeline         # Full pipeline view
/crm:add "John Doe"   # Add contact
```

## Python Integration

```python
# turbo
from core.crm import CRM
crm = CRM()
print(crm.get_pipeline_summary())
```

---

🧲 **One suite. All CRM operations.**
