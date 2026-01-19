---
description: Manage API keys and integrations
---

# /api/keys - API Key Manager

> **Generate and manage API access (Pro plan)**

## List Keys

// turbo

```bash
cat ~/.agencyos/keys.json 2>/dev/null || echo "No keys yet"
```

## Generate Key

```bash
python3 -c "import secrets; print(f'agos_{secrets.token_hex(32)}')"
```

## API Endpoints

| Endpoint      | Auth         |
| ------------- | ------------ |
| `/api/v1/*`   | Bearer token |
| `/webhooks/*` | Signature    |

## 🏯 Binh Pháp

> "Kiểm soát truy cập" - Control access, control data.
