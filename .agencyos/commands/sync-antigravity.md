---
description: Sync best practices from Google Antigravity documentation into your project
---

# /sync-antigravity

Đồng bộ các best practices và patterns từ Google Antigravity documentation vào project của bạn.

## Khi nào sử dụng

- 📖 Khi muốn cập nhật docs theo format Antigravity mới nhất
- 🔧 Khi cần áp dụng keyboard shortcuts chuẩn
- 📋 Khi muốn tạo Getting Started page chuyên nghiệp
- 🎯 Khi cần sync navigation patterns

## Workflow

### Step 1: Chọn nội dung cần sync

Truy cập https://antigravity.google/docs và chọn section cần sync:
- `/docs/get-started` - Getting Started & System Requirements
- `/docs/agent` - Agent documentation patterns
- `/docs/editor` - Editor integration guides

### Step 2: Extract content

Dùng browser để đọc nội dung (Antigravity là SPA):

```
Đọc trang https://antigravity.google/docs/[section]
Extract:
1. Main headings
2. System requirements tables
3. Keyboard shortcuts
4. Code examples
5. Navigation patterns
```

### Step 3: Transform to AgencyOS format

Chuyển đổi content sang format AgencyOS:

```markdown
---
title: [Section Name]
description: "[Description synced from Antigravity]"
section: [getting-started|docs|reference]
order: [number]
published: true
---

# [Title]

## System Requirements (nếu có)

| Platform | Minimum Version | Notes |
|----------|-----------------|-------|
| macOS | 12+ | Apple Silicon |
| Windows | 10 64-bit | - |
| Linux | glibc >= 2.28 | Ubuntu 20+ |

## Keyboard Shortcuts (nếu có)

| Shortcut | Action |
|----------|--------|
| Cmd+E | Open Agent Manager |
| Cmd+K | Command Palette |

## [Remaining content...]
```

### Step 4: Deploy

```bash
git add -A
git commit -m "sync: [section] from Antigravity docs"
git push origin main
```

## Patterns to Sync

### 1. System Requirements Table

```markdown
| Platform | Minimum Version | Notes |
|----------|-----------------|-------|
| **macOS** | 12 (Monterey) + | Apple Silicon recommended |
| **Windows** | 10 (64-bit) | Windows 11 fully supported |
| **Linux** | glibc >= 2.28 | Ubuntu 20+, Debian 10+ |
| **Python** | 3.8+ | Required for CLI |
```

### 2. Keyboard Shortcuts

```markdown
| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + E` | Open Agent Manager |
| `Cmd/Ctrl + K` | Command Palette |
| `Cmd/Ctrl + Shift + P` | All Commands |
```

### 3. Premium Card Navigation

```html
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
  <a href="/link" style="padding: 1.5rem; background: var(--color-bg-tertiary); border-radius: 0.75rem; border: 1px solid var(--color-border);">
    <div style="font-size: 1.5rem;">📥</div>
    <strong>Title</strong>
    <p style="font-size: 0.875rem; opacity: 0.7;">Description</p>
  </a>
</div>
```

### 4. Feature Highlight Box

```html
<div style="text-align: center; padding: 2rem; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 1rem;">
  <div style="font-size: 2.5rem;">🚀</div>
  <h3 style="color: #fff;">Feature Name</h3>
  <p style="color: rgba(255,255,255,0.7);">Description</p>
</div>
```

## Sections Already Synced

- ✅ `/docs/getting-started` - System Requirements, Keyboard Shortcuts
- ✅ `/docs/antigravity` - Binh Pháp x Antigravity integration

## Resources

- 🌐 [Antigravity Docs](https://antigravity.google/docs)
- 📖 [AgencyOS Getting Started](/docs/getting-started)
- 🏯 [Binh Pháp Framework](/docs/reference/binh-phap)
- 🔗 [Antigravity Integration](/docs/antigravity)

---

**Lưu ý**: Antigravity là SPA, cần dùng browser để extract content. Không thể đọc trực tiếp bằng curl/fetch.
