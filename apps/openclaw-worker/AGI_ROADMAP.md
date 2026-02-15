# ĐỀ BÀI AGI CHO TÔM HÙM CTO

## ĐỊNH NGHĨA AGI (Tôm Hùm Edition)

AGI = Autonomous General Intelligence - khả năng **tự nhận task → tự plan → tự code → tự test → tự deploy → tự learn** mà KHÔNG cần con người can thiệp.

## 7 CẤP ĐỘ AGI TÔM HÙM

### Level 1: Task Runner ✅ (ĐÃ ĐẠT)  
- Nhận mission file → dispatch → CC CLI xử lý → archive
- Đã chứng minh: raas-demo, algo-trader

### Level 2: Self-Healing ✅ (ĐÃ ĐẠT)
- Tmux die → auto respawn
- Mission lock → chống double-dispatch
- Thermal gate → cooling khi quá nóng

### Level 3: Self-Testing 🔄 (ĐANG LÀM)
- Sau khi code xong → tự chạy `npm run build`
- Build RED → tự tạo fix mission
- Build GREEN → tự commit + push

### Level 4: Self-Planning ❌ (CẦN LÀM)
- Scan codebase → tìm improvements 
- Tự tạo TODO list từ analysis
- Prioritize tasks theo impact/effort
- Tự chia task lớn thành nhiều task nhỏ

### Level 5: Self-Learning ❌ (CẦN LÀM)
- Sau mỗi mission → phân tích result
- Ghi nhận pattern: cái gì work, cái gì fail
- Cập nhật BINH_PHAP_MASTER.md từ lessons learned
- Tự điều chỉnh strategy cho mission tiếp theo

### Level 6: Self-Evolving ❌ (CẦN LÀM)
- Tự viết code cải thiện chính nó
- Thêm tools/capabilities mới
- Optimize token usage
- Tự tạo skills mới trong .claude/skills/

### Level 7: Multi-Project Commander ❌ (CẦN LÀM)
- Quản lý N dự án song song
- Allocate resources giữa projects
- Cross-project knowledge sharing
- Portfolio-level optimization

## VÒNG LẶP AGI (Auto-CTO Loop)

```
┌─────────────────────────────────────────┐
│           TÔM HÙM AGI LOOP             │
│                                         │
│  1. SCAN → Quét tất cả apps/            │
│     ↓                                   │
│  2. ANALYZE → Tìm bugs, improvements    │
│     ↓                                   │
│  3. PLAN → Tạo mission files            │
│     ↓                                   │
│  4. EXECUTE → CC CLI xử lý              │
│     ↓                                   │
│  5. VERIFY → Build + Test               │
│     ↓                                   │
│  6. LEARN → Ghi nhận kết quả            │
│     ↓                                   │
│  7. EVOLVE → Cải thiện chính nó         │
│     ↓                                   │
│  └── LOOP BACK TO 1 ──────────────┘     │
└─────────────────────────────────────────┘
```

## ĐỀ BÀI CỤ THỂ: UPGRADE TỪ LEVEL 2 → LEVEL 5

### Mission 1: Self-Testing Gate (Level 3)
File: `lib/post-mission-gate.js`
- Sau mỗi mission COMPLETE:
  1. `cd` vào project dir
  2. `npm run build` → capture output
  3. Nếu RED → tạo `HIGH_mission_{project}_fix_build.txt` trong `tasks/`
  4. Nếu GREEN → `git add . && git commit`
  5. Log result vào `mission-history.json`

### Mission 2: Self-Planning Scanner (Level 4)  
File: `lib/project-scanner.js`
- Mỗi 30 phút scan `apps/`:
  1. Chạy `npm run build` cho mỗi project
  2. Chạy `npx eslint .` nếu có
  3. Check `package.json` outdated deps
  4. Tìm TODO/FIXME comments
  5. Generate prioritized task list
  6. Tạo mission files cho top 3 issues

### Mission 3: Self-Learning Journal (Level 5)
File: `lib/mission-journal.js`  
- Sau mỗi mission:
  1. Record: task, duration, success/fail, tokens used
  2. Analyze patterns: which types succeed most?
  3. Identify: common failure modes
  4. Generate weekly insight report
  5. Update auto-cto strategy based on learnings
  6. Persist in `data/mission-history.json`

## KPIs ĐO LƯỜNG AGI PROGRESS

| Metric | Level 2 (Now) | Level 5 (Target) |
|--------|:---:|:---:|
| Human intervention | Every mission | 0 per day |
| Build success rate | ~50% | >90% |
| Self-generated tasks | 0 | 10+/day |
| Learning entries | 0 | 1 per mission |
| Code quality trend | Unknown | Improving |
| Token efficiency | Unmeasured | <50k/mission avg |

## BINH PHÁP MAPPING

- Level 3 (Testing) = Ch.4 軍形 — 先為不可勝 (First make yourself undefeatable)
- Level 4 (Planning) = Ch.1 始計 — 計利以聽 (Calculate advantage, then act)
- Level 5 (Learning) = Ch.13 用間 — 知彼知己 (Know enemy, know self)
- Level 6 (Evolving) = Ch.11 九地 — 投之亡地然後存 (Throw into danger, then survive)
- Level 7 (Commander) = Ch.12 火攻 — 合于利而動 (Move when advantageous)
