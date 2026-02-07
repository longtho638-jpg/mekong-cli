# 🧠 Mekong-CLI Accumulated Insights

> File này được T1 mekong-cli đọc mỗi sáng để nhớ bài học cũ.
> Chỉ thêm mới, không xóa. Đánh dấu [RESOLVED] khi đã fix.

## 2026-02-07 — Session đầu tiên

### Architecture

- [2026-02-07] PATTERN: T1 mekong-cli hoạt động như Supreme Commander — verify + execute trên tất cả sub-projects từ monorepo root
- [2026-02-07] PATTERN: Agent Team (fullstack-developer, ui-ux-designer, debugger, planner) hoạt động tốt trong mode supervisor
- [2026-02-07] PATTERN: Sau compact, CC CLI reload CLAUDE.md + skills — cần giữ file nhỏ gọn

### Bugs & Issues

- [2026-02-07] BUG: `git commit` từ monorepo root không thể commit files trong submodule — phải `cd` vào submodule trước
- [2026-02-07] BUG: Cleo task lock conflict khi multiple sessions chạy — dùng `rm -f .cleo/todo.json.lock`
- [2026-02-07] BUG: apex-os không có submodule mapping trong .gitmodules — cần fix

### Optimization

- [2026-02-07] OPTIMIZATION: Context window compact liên tục khi verify nhiều files — cần focus files quan trọng nhất
- [2026-02-07] OPTIMIZATION: Proxy config cần Opus 4.6 priority 98 + Gemini 3 Pro High cho speed

### Security

- [2026-02-07] SECURITY: CC CLI `--dangerously-skip-permissions` cần thiết cho auto mode nhưng phải canh chừng destructive operations

### Skills

- [2026-02-07] PATTERN: Global CLAUDE.md = menu (metadata), Local .claude/skills/ = công thức (implementation) — phải có cả 2
- [2026-02-07] PATTERN: Cook skill cần symlink vào từng project, không tự load từ global

### Proxy

- [2026-02-07] BUG: Port 8045 (Desktop App) thiếu Opus 4.6 — dùng port 8080 (npm CLI)
- [2026-02-07] PATTERN: CC CLI hỏi lại liên tục = dấu hiệu proxy/model config sai — check ngay
- [2026-02-07] OPTIMIZATION: Hybrid model strategy: Opus 4.6 Thinking (complex) + Gemini 3 Pro High (speed)
