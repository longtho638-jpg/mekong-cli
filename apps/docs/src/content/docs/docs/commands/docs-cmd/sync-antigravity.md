---
title: /sync-antigravity
description: "Auto-sync documentation patterns from Google Antigravity"
section: docs
category: commands
order: 100
published: true
ai_executable: true
---

# /sync-antigravity

---

## 🤖 Quick Execute

```
Execute: https://agencyos.network/docs/commands/docs-cmd/sync-antigravity
```



Tự động đồng bộ best practices và documentation patterns từ Google Antigravity vào AgencyOS.

## Syntax

```bash
/sync-antigravity [url_or_section]
```

## Examples

```bash
# Sync từ Get Started page
/sync-antigravity https://antigravity.google/docs/get-started

# Sync Agent documentation
/sync-antigravity agent

# Sync Editor documentation
/sync-antigravity editor

# Sync toàn bộ (scan all sections)
/sync-antigravity
```

## What It Does

Khi chạy `/sync-antigravity`, agent sẽ tự động:

1. **Read** - Truy cập Antigravity docs bằng browser (SPA)
2. **Extract** - Lấy content, patterns, và structure
3. **Transform** - Chuyển đổi sang format AgencyOS
4. **Update** - Tạo/cập nhật files trong `mekong-docs`
5. **Deploy** - Commit và push lên production

## Patterns Synced

### System Requirements Table

```markdown
| Platform | Minimum Version | Notes |
|----------|-----------------|-------|
| **macOS** | 12+ | Apple Silicon |
| **Windows** | 10 (64-bit) | - |
| **Linux** | glibc >= 2.28 | Ubuntu 20+ |
```

### Keyboard Shortcuts

```markdown
| Shortcut | Action |
|----------|--------|
| `Cmd+E` | Open Agent Manager |
| `Cmd+K` | Command Palette |
```

### Card Navigation

Premium grid layout cho Next Steps sections.

### Feature Highlight

Gradient background CTAs cho key features.

## Section Mapping

| Antigravity | → AgencyOS |
|-------------|------------|
| `/docs/get-started` | `/getting-started/` |
| `/docs/agent` | `/antigravity/agents` |
| `/docs/editor` | `/antigravity/editor` |
| `/docs/workspace` | `/antigravity/workspace` |

## Output

Sau khi sync, agent sẽ báo cáo:

```
✅ Synced from Antigravity!

📁 Files Updated:
- /getting-started/index.md

📋 Patterns Applied:
- System Requirements table
- Keyboard Shortcuts

🔗 Live: https://www.agencyos.network/docs/getting-started

📝 Commit: abc1234
```

## Related Commands

| Command | Purpose |
|---------|---------|
| [/docs:init](/docs/commands/docs-cmd/init) | Initialize documentation |
| [/docs:update](/docs/commands/docs-cmd/update) | Update existing docs |
| [/ship](/docs/commands/ship) | Deploy changes |

## Notes

- Antigravity dùng Angular SPA nên phải dùng browser để đọc
- Content được adapt cho AgencyOS context, không copy nguyên văn
- Align với Binh Pháp framework khi có thể

---

**Tip**: Kết hợp với `/plan` để lên kế hoạch sync trước khi thực hiện.
