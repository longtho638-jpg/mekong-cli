# 🌅 Mekong-CLI Morning Boot Protocol

## Mục tiêu

T1 mekong-cli là Supreme Commander — bật TRƯỚC mỗi ngày, tự cải thiện, rồi verify + fix tất cả sub-projects.

## Quy trình Boot (Tự động khi nhận /cook hoặc /insight)

### Phase 0: Self-Insight (5-10 min)

```
/insight
```

- Đọc `insights/accumulated.md` → nhớ bài học cũ
- Scan chính mekong-cli core:
  - `package.json` — dependencies outdated?
  - `turbo.json` — pipeline config optimal?
  - `CLAUDE.md` — rules cần update?
  - `.claude/skills/` — skills cần upgrade?
  - `plans/` — plans nào outdated?
- Ghi insight mới vào `insights/accumulated.md`
- Fix lỗi nếu tìm thấy → commit

### Phase 1: Self-Improvement (5-10 min)

- Cập nhật CLAUDE.md nếu có rule mới
- Cập nhật skills nếu có pattern mới
- Cập nhật plans nếu có strategy mới
- `pnpm install` nếu cần
- `git commit -m "chore: morning self-improvement"`

### Phase 2: Sub-Project Scan (Per project 5-15 min)

```
FOR each app IN apps/*:
  1. cd apps/$app
  2. git status → check pending changes
  3. git pull → sync latest
  4. pnpm build → verify compilation
  5. IF build fails → fix errors
  6. Read CLAUDE.md → understand project context
  7. Read plans/ → check remaining tasks
  8. git commit + push → save fixes
  9. Log status to insights/daily-report.md
```

### Phase 3: Cook Execution (Per project 15-30 min)

```
/cook Execute remaining metamorphosis phases for all sub-projects.
Start with the project that has most pending phases.
Build must pass. Git commit + push after each phase.
```

### Phase 4: Daily Report

- Ghi tổng kết vào `insights/daily-report-YYYY-MM-DD.md`
- Cập nhật `insights/accumulated.md` với bài học mới

## Sub-Projects Registry

| Project           | Path                   | Priority |
| ----------------- | ---------------------- | -------- |
| agencyos-landing  | apps/agencyos-landing  | HIGH     |
| sophia-ai-factory | apps/sophia-ai-factory | HIGH     |
| 84tea             | apps/84tea             | MEDIUM   |
| Well              | ../Well (external)     | MEDIUM   |

## Insights Accumulation Rules

1. Mỗi ngày thêm insight mới vào `insights/accumulated.md`
2. Không xóa insight cũ — chỉ đánh dấu [RESOLVED] nếu đã fix
3. Insight format: `- [YYYY-MM-DD] Category: Description`
4. Categories: BUG, PATTERN, OPTIMIZATION, ARCHITECTURE, SECURITY

## Startup Command

```bash
cd ~/mekong-cli && claude --dangerously-skip-permissions
```

Sau đó gõ:

```
/insight Chạy Morning Boot Protocol. Đọc plans/morning-boot-protocol.md và insights/accumulated.md. Tự cải thiện trước, rồi scan + fix tất cả sub-projects. Ghi daily report.
```
