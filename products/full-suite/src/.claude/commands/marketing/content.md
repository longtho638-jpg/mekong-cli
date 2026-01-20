---
description: Generate marketing content with AI
---

# /marketing/content - AI Content Generator

> **Generate blog posts, social media, email campaigns**

## Quick Generate

// turbo

```bash
python3 scripts/vibeos/marketing_engine.py --generate blog
```

## Content Types

| Type     | Command                                       |
| -------- | --------------------------------------------- |
| Blog     | `--generate blog --topic "AI for agencies"`   |
| Twitter  | `--generate twitter --topic "Product launch"` |
| LinkedIn | `--generate linkedin --topic "Case study"`    |
| Email    | `--generate email --campaign "welcome"`       |

## Example

```bash
python3 scripts/vibeos/marketing_engine.py --generate blog \
  --topic "5 ways AI boosts agency productivity" \
  --tone professional
```

## 🏯 Binh Pháp

> "Bất chiến nhi thắng" - Win without fighting, content does the work.
