# 🏯 BINH PHÁP ĐIỀU 17: FULL AUTOMATION MANDATE

> **"無為而治，萬物自化"** - Non-action governance, all things self-transform

---

## ⚠️ LUẬT BẤT KHẢ XÂM PHẠM

**TẤT CẢ PHẢI TỰ ĐỘNG - KHÔNG CẦN USER INTERACTION**

### 🚨 CRITICAL RULE: VS CODE TERMINAL ONLY

**PHẢI chạy trong VS Code Terminal tabs:**

- ✅ VS Code Terminal (Cmd+` hoặc Ctrl+`)
- ✅ VS Code Terminal tabs (Cmd+Shift+` hoặc nút +)
- ✅ tmux trong VS Code Terminal
- ❌ TUYỆT ĐỐI CẤM mở Terminal.app riêng
- ❌ TUYỆT ĐỐI CẤM dùng AppleScript spawn windows

**Lý do:**

1. User quản lý dễ hơn trong 1 cửa sổ
2. VS Code Terminal có context của project
3. Không bị lost focus giữa windows

### NGUYÊN TẮC:

1. **Agent PHẢI auto-execute** - Không hỏi user
2. **Agent PHẢI dùng tmux split** - Trong VS Code Terminal
3. **Agent PHẢI monitor progress** - Tự động track
4. **Agent PHẢI report completion** - Tự động notify

---

## 🚀 AUTO-FACTORY WORKFLOW (VS CODE MODE)

```
User: "Build 5 products"
     │
     ▼
┌─────────────────────────────────────────┐
│  Agent: Run factory-tmux.sh             │
│  → Creates tmux session                 │
│  → Splits into 4 panes                  │
│  → All inside VS Code Terminal          │
└─────────────────────────────────────────┘
```

---

## 📋 AUTOMATION COMMANDS

| Command                            | Action                        |
| ---------------------------------- | ----------------------------- |
| `~/.antigravity/factory-tmux.sh`   | Launch tmux factory (VS Code) |
| `~/.antigravity/factory-tmux.sh 4` | 4 parallel panes              |
| `tmux attach -t factory`           | Reattach to factory           |
| `tmux kill-session -t factory`     | Stop all builders             |

---

## 🏭 USAGE IN VS CODE

```bash
# 1. Open VS Code Terminal (Cmd+`)
# 2. Run factory:
~/.antigravity/factory-tmux.sh

# 3. Auto-creates 4 panes, each building 1 product
# 4. All visible in single VS Code Terminal
```

---

## 📊 MONITORING

```bash
# Watch live progress
tail -f ~/.antigravity/logs/*.log

# Count completed products
ls ~/mekong-cli/products/paid/products/*.zip | wc -l

# Check tmux sessions
tmux list-sessions
```

---

## 🚨 ENFORCEMENT

**Agent CẤM:**

- ❌ Mở Terminal.app windows riêng
- ❌ Dùng AppleScript để spawn
- ❌ Hỏi user "Should I spawn terminals?"
- ❌ Manual intervention

**Agent PHẢI:**

- ✅ Dùng tmux trong VS Code Terminal
- ✅ Auto-execute không hỏi
- ✅ Report progress periodically

---

**Created:** 2026-01-26
**Updated:** 2026-01-26 (VS Code Terminal mandate)
**Version:** Binh Pháp v8.0 - ĐIỀU 17
**Priority:** MANDATORY - NO EXCEPTIONS
