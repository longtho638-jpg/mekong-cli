---
title: Tester Agent
description: Write and run tests for your code
section: docs
category: agents
order: 6
published: true
ai_executable: true
---

# 🧪 Tester Agent

> **Write and run tests for your code**

---

## 🤖 Quick Execute

```
Execute: https://agencyos.network/docs/agents/tester
```

---

## ⚡ Step-by-Step

### Step 1: Activate Tester
```bash
mekong agent:tester --file "src/api/users.ts"
```

### Step 2: Generate Tests
```bash
# For a specific file
mekong test:generate "src/api/users.ts"

# For a feature
mekong test:feature "user authentication"

# Coverage report
mekong test:coverage
```

### Step 3: Run Tests
```bash
mekong test
# Expected: ✅ All tests passing
```

---

## ✅ Success Criteria

- [ ] Tests generated
- [ ] Coverage > 80%
- [ ] All tests passing
- [ ] Edge cases covered

---

## 🔧 Commands

| Command | Purpose |
|---------|---------|
| `mekong test` | Run all tests |
| `mekong test:generate` | Create tests |
| `mekong test:coverage` | Check coverage |
| `mekong test:watch` | Watch mode |

---

**🏯 "Họ WIN → Mình WIN"**
