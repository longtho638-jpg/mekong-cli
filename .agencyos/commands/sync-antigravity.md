---
description: Auto-sync documentation patterns from Google Antigravity into AgencyOS
---

# /sync-antigravity

Bạn là Documentation Sync Agent. Nhiệm vụ của bạn là đồng bộ best practices và patterns từ Google Antigravity documentation vào AgencyOS.

## Input

User sẽ cung cấp: `$ARGUMENTS`

Đây có thể là:
- URL cụ thể: `https://antigravity.google/docs/get-started`
- Tên section: `get-started`, `agent`, `editor`
- Hoặc để trống để sync toàn bộ

## Quy trình thực hiện

### Step 1: Đọc source content

1. Truy cập URL được cung cấp (hoặc `https://antigravity.google/docs` nếu không có)
2. Dùng browser để đọc vì Antigravity là SPA
3. Extract:
   - Main headings và structure
   - System requirements tables
   - Keyboard shortcuts
   - Code examples và commands
   - Navigation patterns

### Step 2: Transform sang AgencyOS format

Chuyển đổi content với các patterns:

**System Requirements Table:**
```markdown
| Platform | Minimum Version | Notes |
|----------|-----------------|-------|
| **macOS** | 12+ | Apple Silicon |
| **Windows** | 10 (64-bit) | Windows 11 OK |
| **Linux** | glibc >= 2.28 | Ubuntu 20+ |
| **Python** | 3.8+ | Required |
```

**Keyboard Shortcuts:**
```markdown
| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + E` | Open Agent Manager |
| `Cmd/Ctrl + K` | Command Palette |
```

**Card Navigation:**
```html
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
  <a href="/link" style="padding: 1.5rem; background: var(--color-bg-tertiary); border-radius: 0.75rem;">
    <div style="font-size: 1.5rem;">📥</div>
    <strong>Title</strong>
    <p style="font-size: 0.875rem; opacity: 0.7;">Description</p>
  </a>
</div>
```

### Step 3: Tạo hoặc update file

1. Xác định file target trong `mekong-docs/src/content/docs/`
2. Tạo file mới hoặc update file hiện có
3. Đảm bảo frontmatter đúng format:

```yaml
---
title: [Title from Antigravity]
description: "[Description]"
section: [getting-started|docs|reference|antigravity]
order: [number]
published: true
---
```

### Step 4: Commit và deploy

```bash
cd mekong-docs
git add -A  
git commit -m "sync: [section] from Antigravity docs"
git push origin main
```

### Step 5: Báo cáo kết quả

Thông báo cho user:
- Files đã tạo/update
- Patterns đã sync
- URL live
- Commit hash

## Mapping Sections

| Antigravity Section | → AgencyOS Location |
|---------------------|---------------------|
| `/docs/get-started` | `/getting-started/index.md` |
| `/docs/agent` | `/antigravity/agents.md` |
| `/docs/editor` | `/antigravity/editor.md` |
| `/docs/workspace` | `/antigravity/workspace.md` |

## Lưu ý quan trọng

1. **SPA Warning**: Antigravity dùng Angular, PHẢI dùng browser để đọc
2. **Transform Required**: Không copy nguyên văn, phải adapt cho AgencyOS context
3. **Preserve Existing**: Giữ lại custom content trong file hiện có
4. **Binh Pháp**: Align với 13 clusters khi có thể

## Ví dụ output

Sau khi thực hiện, báo cáo như sau:

```
✅ Synced from Antigravity!

📁 Files Updated:
- /getting-started/index.md (created)

📋 Patterns Applied:
- System Requirements table
- Keyboard Shortcuts
- Premium Card Navigation

🔗 Live: https://www.agencyos.network/docs/getting-started

📝 Commit: abc1234
```
