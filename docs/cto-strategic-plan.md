# CTO Strategic Plan — Từ Team Lead Lên C-Level

> CTO không chỉ dispatch task. CTO phải **ra quyết định kỹ thuật** ảnh hưởng toàn bộ ecosystem.

---

## 1. Technical ROI Assessment (Mỗi 30 phút)

CTO tự scan và so sánh ROI kỹ thuật giữa projects:

```
ROI Score = (Tests Pass Rate × Build Speed × Code Quality) / (Tech Debt Count × Open Bugs)
```

| Metric | Cách đo | Weight |
|--------|---------|--------|
| Test pass rate | `npm test --silent 2>&1 \| grep -c PASS` / total | 30% |
| Build speed | `time npm run build` (giây) | 15% |
| Tech debt | `grep -rc "TODO\|FIXME\|HACK" src` | 25% |
| Type safety | `grep -rc ": any" src` | 15% |
| Git velocity | `git log --since="24h" --oneline \| wc -l` | 15% |

**Quyết định từ ROI:**
- Project có ROI thấp nhất → ưu tiên dispatch workers vào đó
- Project có ROI cao + stable → giảm worker, chuyển sang project yếu
- 2 projects cùng ROI thấp → dispatch song song P1+P2

## 2. Tech Debt Detection & Triage

CTO phân loại debt thành 3 mức:

| Mức | Tiêu chí | Action |
|-----|----------|--------|
| **P0 Critical** | Build fail, test crash, security vuln | Dispatch ngay, block feature work |
| **P1 High** | >20 TODOs, any types >10, flaky tests | Dispatch khi idle, trước feature |
| **P2 Low** | Console.log cleanup, docs outdated | Auto-CTO pilot xử lý khi rảnh |

**Scan command (chạy mỗi cycle):**
```javascript
const debt = {
  critical: buildFail || testCrash || securityVuln,
  high: todoCount > 20 || anyTypes > 10 || flakyTests > 0,
  low: consoleCount > 0 || docsStale
};
```

## 3. Chairman Reporting (Mỗi giờ)

CTO ghi report vào `~/.openclaw/cto-hourly-report.json`:

```json
{
  "timestamp": "2026-03-09T01:00:00Z",
  "projects": {
    "algo-trader": { "roi": 72, "debt": "P1", "missions_completed": 3, "missions_failed": 0 },
    "well": { "roi": 85, "debt": "P2", "missions_completed": 5, "missions_failed": 1 },
    "sophia": { "roi": 60, "debt": "P0", "missions_completed": 1, "missions_failed": 2 }
  },
  "decisions": [
    "sophia ROI thấp nhất → tăng P3 priority",
    "well stable → giảm dispatch frequency"
  ],
  "ram_avg": "11.2GB",
  "escalations": 1,
  "dlq_count": 0
}
```

Chairman đọc file này để review. Không cần CTO interrupt.

## 4. Adaptive RAM Policy (Tự quyết định dài hạn)

CTO track RAM usage trung bình theo giờ. Nếu pattern lặp lại:

| Pattern | Quyết định |
|---------|-----------|
| 3 giờ liên tiếp RAM >13GB | Giảm max_workers xuống 2 vĩnh viễn |
| 3 giờ liên tiếp RAM <10GB | Tăng max_workers lên 3 |
| Thermal throttle >5 lần/giờ | Giảm CHECK_INTERVAL từ 30s → 60s |
| 0 thermal throttle 2 giờ | Khôi phục CHECK_INTERVAL về 30s |

**Lưu config vào:** `~/.openclaw/adaptive-config.json`
```json
{
  "max_workers": 3,
  "check_interval_ms": 30000,
  "last_adjusted": "2026-03-09T01:00:00Z",
  "reason": "RAM stable <10GB 3 giờ liên tiếp"
}
```

CTO đọc file này khi boot thay vì hardcode.

## 5. Autonomous Decision Matrix

| Tình huống | CTO Tự Quyết | Cần Chairman |
|------------|--------------|-------------|
| Dispatch task cho idle worker | ✅ Tự quyết | |
| Escalation level 1-3 | ✅ Tự quyết | |
| Thay đổi RAM policy | ✅ Tự quyết | |
| Chuyển model fallback | ✅ Tự quyết | |
| DLQ skip mission | ✅ Tự quyết + log | |
| Thay đổi project priority order | ✅ Tự quyết dựa ROI | |
| Thêm project mới vào routing | | ❌ Chairman approve |
| Thay đổi IRON GUARD rules | | ❌ Chairman approve |
| Sửa config.js locked values | | ❌ Chairman approve |
| Kill P0 process | | ❌ TUYỆT ĐỐI CẤM |

---

## Roadmap Nâng Cấp

| Phase | Mô tả | Status |
|-------|-------|--------|
| 1. Team Lead | Dispatch + monitor + escalation | ✅ Done (v1) |
| 2. C-Level | ROI assessment + debt triage + adaptive policy | 📋 Planned |
| 3. Strategic | Cross-project optimization + predictive scheduling | 🔮 Future |

---

_Tạo: 2026-03-09 | Dựa trên: cto-team-architecture.md v1_
