# 🦞 Tôm Hùm v29.4 — Hệ thống AI Agent tự hành trên MacBook M1

## Cách vận hành trong ảnh:

**3 AI cùng làm việc song song trên 1 máy:**

- **Trái (Pane 0):** Claude Code CLI đang tự audit Sophia AI Factory — quét runtime errors, đọc code, sửa lỗi. Dùng lệnh `/cook` của ClaudeKit.
- **Phải (Pane 1):** Claude Code CLI thứ 2 đang chạy 兵法 (Binh Pháp) — full audit WellNexus. Dùng lệnh `/binh-phap implement:` với cấu trúc HÌNH THẾ → THẾ → LỰC.
- **Sidebar phải:** Antigravity (Google Gemini) đóng vai **Giám sát viên** — theo dõi cả 2 pane, phát hiện bug, tối ưu, và dispatch mission mới.

## Stack kỹ thuật:

- **Tôm Hùm** (Node.js daemon) = Bộ não tmux, tự boot 2 pane CC CLI, phát hiện mission file, dispatch đúng project + đúng `/command`
- **Antigravity Proxy** = Chuyển request Claude qua Gemini, tiết kiệm chi phí
- **ClaudeKit Engineer** = 80+ skills, 50+ commands, 17+ agents — toàn bộ kho vũ khí được ánh xạ tự động theo loại mission
- **Auto-CTO** = Tự generate mission mới khi pane rảnh

**Kết quả:** 2 dự án được audit đồng thời, zero human intervention, trên MacBook M1 16GB RAM. Load ~2.5, RAM ~600MB. Tự hành hoàn toàn. 🔥
