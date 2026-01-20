---
description: 🏯 Quick WIN-WIN-WIN alignment check
argument-hint: [deal/decision]
---

## Mission

Validate WIN-WIN-WIN alignment for a deal or decision.

<context>$ARGUMENTS</context>

---

## Validation

Check each party:

```
┌───────────────────────────────────────────────────┐
│  👑 ANH (Owner) WIN gì?                           │
│  🏢 AGENCY WIN gì?                                │
│  🚀 STARTUP/CLIENT WIN gì?                        │
│                                                   │
│  ❌ Any LOSE → STOP                              │
│  ✅ All WIN → PROCEED                            │
└───────────────────────────────────────────────────┘
```

## Output

```json
{
  "anh_win": "[describe win]",
  "agency_win": "[describe win]",
  "startup_win": "[describe win]",
  "is_aligned": true|false,
  "recommendation": "PROCEED|REVIEW|STOP"
}
```

---

✅ *All WIN = SHARED EXIT SUCCESS*
