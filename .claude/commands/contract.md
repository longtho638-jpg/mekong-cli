---
description: 📜 CONTRACT - Generate and manage legal agreements
---

# /contract - Contract Generation Command

> **"Giấy trắng mực đen"** - Clear Agreements

## Usage

```bash
/contract [action] [args]
```

## Actions

| Action | Description | Example |
|--------|-------------|---------|
| `gen` | Generate contract from template | `/contract gen --template msa --client "Acme Inc"` |
| `list` | List available templates | `/contract list` |
| `verify` | Check contract variables | `/contract verify --file msa_acme.md` |

## Execution Protocol

1.  **Agent**: Delegates to `contract-admin`.
2.  **Tool**: Uses `scripts/contract_gen/generator.py`.
3.  **Output**: Generates Markdown in `contracts/output/`.

## Examples

```bash
# Generate a Standard Master Service Agreement
/contract gen --template msa --email client@example.com

# List all templates
/contract list
```

## Win-Win-Win
- **Owner**: Legal protection.
- **Agency**: Fast deal closure.
- **Client**: Clear terms and expectations.
