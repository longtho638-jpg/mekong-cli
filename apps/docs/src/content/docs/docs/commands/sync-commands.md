---
title: Sync Commands
description: "Auto-sync documentation from Google Antigravity with Binh Pháp alignment"
section: docs
category: commands
order: 99
published: true
ai_executable: true
---

# Sync Commands

---

## 🤖 Quick Execute

```
Execute: https://agencyos.network/docs/commands/sync-commands
```



Tự động đồng bộ documentation từ Google Antigravity vào AgencyOS. Mỗi command được ánh xạ với một cluster trong Binh Pháp.

## Quick Reference

| Command | Binh Pháp | Syncs |
|---------|-----------|-------|
| `/sync-agent` | 謀攻篇 Mưu Công | Agent, Models, Modes |
| `/sync-rules` | 法篇 Pháp | Rules & Workflows |
| `/sync-tasks` | 軍爭篇 Quân Tranh | Task Groups, Task List |
| `/sync-browser` | 火攻篇 Hoả Công | Browser Subagent |
| `/sync-mcp` | 用間篇 Dụng Gián | MCP Tools |
| `/sync-artifacts` | 計篇 Kế Hoạch | All Artifacts |
| `/sync-editor` | 九變篇 Cửu Biến | Editor Features |
| `/sync-all` | 始計篇 Thủy Kế | **Everything** |

---

## /sync-agent

Đồng bộ Core Agent documentation.

```bash
/sync-agent              # Sync all
/sync-agent models       # Models only
/sync-agent modes        # Agent Modes only
```

**Binh Pháp**: 謀攻篇 (Mưu Công) - Thắng không cần đánh

---

## /sync-rules

Đồng bộ Rules & Workflows documentation.

```bash
/sync-rules
```

**Binh Pháp**: 法篇 (Pháp) - Tổ chức và kỷ luật

---

## /sync-tasks

Đồng bộ Task Groups và Task List.

```bash
/sync-tasks              # Sync all
/sync-tasks groups       # Task Groups only
/sync-tasks list         # Task List only
```

**Binh Pháp**: 軍爭篇 (Quân Tranh) - Tốc độ và cơ động

---

## /sync-browser

Đồng bộ Browser Subagent và Recordings.

```bash
/sync-browser            # Sync all
/sync-browser subagent   # Browser Subagent only
/sync-browser recordings # Recordings only
```

**Binh Pháp**: 火攻篇 (Hoả Công) - Disruption tactics

---

## /sync-mcp

Đồng bộ MCP (Model Context Protocol) documentation.

```bash
/sync-mcp
```

**Binh Pháp**: 用間篇 (Dụng Gián) - Intelligence & Integration

---

## /sync-artifacts

Đồng bộ tất cả Artifacts documentation.

```bash
/sync-artifacts          # Sync all
/sync-artifacts plan     # Implementation Plan only
/sync-artifacts walkthrough
/sync-artifacts knowledge
```

**Binh Pháp**: 計篇 (Kế Hoạch) - Strategic Planning

---

## /sync-editor

Đồng bộ Editor features documentation.

```bash
/sync-editor             # Sync all
/sync-editor tab         # Tab management
/sync-editor command     # Command palette
/sync-editor panel       # Agent Side Panel
```

**Binh Pháp**: 九變篇 (Cửu Biến) - Adaptability

---

## /sync-all

Master command - đồng bộ TOÀN BỘ Antigravity documentation.

```bash
/sync-all
```

**Binh Pháp**: 始計篇 (Thủy Kế) - Initial Assessment & Complete Strategy

### What it does:

1. Chạy tất cả sync commands tuần tự
2. Tạo/update 15+ documentation pages
3. Update navigation sidebar
4. Deploy lên production

---

## Binh Pháp Full Mapping

```mermaid
graph TD
    A[/sync-all<br/>始計篇] --> B[/sync-agent<br/>謀攻篇]
    A --> C[/sync-rules<br/>法篇]
    A --> D[/sync-tasks<br/>軍爭篇]
    A --> E[/sync-browser<br/>火攻篇]
    A --> F[/sync-mcp<br/>用間篇]
    A --> G[/sync-artifacts<br/>計篇]
    A --> H[/sync-editor<br/>九變篇]
```

---

## How It Works

Khi chạy bất kỳ `/sync-*` command:

1. **Read** - Browser đọc Antigravity SPA
2. **Extract** - Lấy content và structure
3. **Transform** - Convert sang AgencyOS format
4. **Update** - Tạo/update markdown files
5. **Deploy** - Commit và push lên production

---

## Related

- [Antigravity Integration](/docs/antigravity)
- [Binh Pháp Framework](/docs/reference/binh-phap)
- [Binh Pháp Mapping](/docs/antigravity/binh-phap-mapping)
