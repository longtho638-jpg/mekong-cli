# 🧬 Brain Surgery Changelog — Tôm Hùm Evolution Log

> 用間 Ch.13: 知己知彼，百戰不殆 — Biết mình biết người, trăm trận không nguy.

---

## 2026-02-23 — Surgery v30: 自知之明 (Self-Knowledge)

### Phẫu Thuật #1: Dedup TTL Fix

**File:** `lib/brain-process-manager.js`

**BEFORE:**
- `recentMissionHashes` = `Set()` không có TTL
- Window size = 20 missions — sau session restart, Set bị xóa nhưng nếu cùng tasks được dispatch lại, 20 missions cũ trong window bị reject
- Vấn đề: `duplicate_rejected` chiếm ~50% missions trong memory.md (20/50+ entries)

**AFTER:**
- `recentMissionHashes` = `Map<hash, timestamp>` với TTL 10 phút
- Hashes tự động expire sau 10 phút — cùng task OK để retry sau 10min
- `isDuplicateMission()` tự purge expired entries trước khi check
- `trackMissionHash()` thay thế manual Set operations

**Expected Impact:** Giảm `duplicate_rejected` từ ~50% → <5% của missions

---

### Phẫu Thuật #2: Project Routing Missing Keywords

**File:** `lib/mission-dispatcher.js`

**BEFORE:**
- Default route = `apps/algo-trader` (sai với focus mode 2026-02-23 = mekong-cli)
- Thiếu keywords: `openclaw-worker`, `openclaw`, `task-watcher`, `brain-process`, `auto-cto`, `mekong-cli`
- → Tasks về openclaw-worker bị route đến algo-trader (sai project!)

**AFTER:**
- Thêm 6 keywords mới cho mekong-cli root
- Default route = `config.MEKONG_DIR` (root) thay vì `apps/algo-trader`
- Phù hợp với FOCUS MODE decree 2026-02-23: "ONLY mekong-cli until AGI"

**Expected Impact:** 100% task về openclaw/mekong-cli route đúng thư mục

---

### Phẫu Thuật #3: Token Tracking Estimation

**File:** `lib/post-mortem-reflector.js`

**BEFORE:**
- `tokensUsed = 0` cho tất cả missions (AG Proxy không expose token counts)
- `tokensPerMin = 0/min` → không thể phân tích efficiency
- Memory.md toàn `0 | 0/min` → vô nghĩa

**AFTER:**
- Khi `tokensUsed = 0`, dùng heuristic: `~200 tokens/min` cho successful missions
- Display: `~400(est)` thay vì `0` để phân biệt estimated vs actual
- Các phân tích `token_waste` và `Efficient mission` vẫn hoạt động với estimated values

**Expected Impact:** Memory.md có dữ liệu hữu ích để phân tích efficiency patterns

---

## Điểm Yếu Còn Lại (Next Surgery)

1. **memory.md chưa có phân tích trend** — Cần logic detect "SAME failure 3+ times → escalate" thay vì chỉ ghi
2. **Auto-CTO không đọc knowledge/ pipeline** — Rule `knowledge-pipeline.md` yêu cầu scan trước khi execute complex task
3. **Token estimation chưa calibrated** — 200 tokens/min chỉ là heuristic, cần benchmark thực tế

**Files cần sửa trong Surgery v31:**
- `lib/post-mortem-reflector.js` — trend detection
- `lib/auto-cto-pilot.js` — knowledge pipeline integration
