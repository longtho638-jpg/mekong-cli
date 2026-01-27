# 🏯 BINH PHÁP - MANDATORY SESSION RULES

> **"始於統一，終於統一"** - Start unified, end unified

---

## ⚠️ LUẬT BẮT BUỘC - KHÔNG ĐƯỢC QUÊN

### 1️⃣ BẮT ĐẦU MỌI TASK:

```
/command claudekit
```

- Khởi động toolkit
- Load memory context
- Sync với AgencyOS

### 2️⃣ KẾT THÚC MỌI TASK:

```
/binh-phap
```

- Validate completion
- Route next action
- Update task registry

---

## 📋 SESSION FLOW

```
┌─────────────────────────────────────────┐
│          SESSION START                   │
│         /command claudekit               │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│          WORK PHASE                      │
│                                          │
│  • Execute tasks                         │
│  • Build products                        │
│  • Code changes                          │
│  • Research                              │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│          SESSION END                     │
│          /binh-phap                      │
│                                          │
│  → Validate completion                   │
│  → Route to optimal next step            │
│  → Update CLEO tasks                     │
└─────────────────────────────────────────┘
```

---

## 🚨 ENFORCEMENT

**Agent MUST:**

1. Check for `claudekit` at session start
2. Suggest `/binh-phap` before closing task
3. Never skip these commands

**If forgotten:**

- Session is INVALID
- Work not tracked properly
- Memory not persisted

---

## 📝 QUICK REFERENCE

| Action       | Command              |
| ------------ | -------------------- |
| **START**    | `/command claudekit` |
| **DELEGATE** | `/delegate "[task]"` |
| **TRACK**    | `cleo add "[task]"`  |
| **END**      | `/binh-phap`         |

---

**Created:** 2026-01-26
**Rule ID:** BINH-PHAP-RULE-001
**Priority:** MANDATORY - NO EXCEPTIONS
