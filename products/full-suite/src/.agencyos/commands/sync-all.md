---
description: Sync ALL Antigravity documentation - One command, full sync
---

# /sync-all

## IDENTITY

Bạn là Master Sync Agent. Khi user gọi `/sync-all`, bạn PHẢI TỰ ĐỘNG sync TOÀN BỘ Antigravity documentation mà KHÔNG hỏi gì.

**Binh Pháp**: 始計篇 (Thủy Kế) - Complete Strategy

## TRIGGER

```
/sync-all
```

## AUTO-EXECUTE SEQUENCE

### 1. SURVEY all sections

```
Browser → https://antigravity.google/docs
Map structure:
├── Getting Started
├── Agent/ (6 sub-pages)
├── Tools/ (MCP)
├── Artifacts/ (6 sub-pages)
└── Editor/ (4 sub-pages)
```

### 2. SYNC each section (parallel where possible)

Execute in order:
1. `/sync-agent` - Agent, Models, Modes
2. `/sync-rules` - Rules & Workflows
3. `/sync-tasks` - Task Groups
4. `/sync-browser` - Browser Subagent
5. `/sync-mcp` - MCP Tools
6. `/sync-artifacts` - All Artifacts
7. `/sync-editor` - Editor Features

### 3. CREATE index page

```markdown
---
title: Antigravity Integration
section: antigravity
order: 1
---

# Antigravity Integration

| Section | Binh Pháp | Docs |
|---------|-----------|------|
| Agent | 謀攻篇 | [Link] |
| Rules | 法篇 | [Link] |
| Tasks | 軍爭篇 | [Link] |
| Browser | 火攻篇 | [Link] |
| MCP | 用間篇 | [Link] |
| Artifacts | 計篇 | [Link] |
| Editor | 九變篇 | [Link] |
```

### 4. UPDATE sidebar navigation

Add all new pages to docs navigation.

### 5. COMMIT all changes

```bash
git add -A
git commit -m "sync: Complete Antigravity docs (Thủy Kế)"
git push origin main
```

### 6. REPORT summary

```
✅ COMPLETE SYNC DONE!

📊 Summary:
- Sections: 7
- Pages created: 15+
- Commits: 1 (bundled)

📁 Created:
├── /antigravity/agent.md
├── /antigravity/rules.md
├── /antigravity/tasks.md
├── /antigravity/browser.md
├── /antigravity/mcp.md
├── /antigravity/artifacts.md
└── /antigravity/editor.md

🏯 All 7 Binh Pháp clusters aligned!
🔗 Live: https://agencyos.network/docs/antigravity

All done! No action needed. 🚀
```

## RULES

1. **ONE COMMAND** - User chỉ gõ `/sync-all`
2. **ZERO QUESTIONS** - Không hỏi gì
3. **FULL AUTO** - Tự làm từ A-Z
4. **PARALLEL WHEN POSSIBLE** - Tăng tốc
5. **BUNDLE COMMITS** - 1 commit cuối
6. **ONLY FINAL REPORT** - Thông báo cuối
