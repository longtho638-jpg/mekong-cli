# 📜 BINH PHÁP × CLAUDEKIT — COMMAND MAP

> CTO + Antigravity PHẢI thuộc bảng này. RULE VĨNH VIỄN.
> Mỗi tình huống → chọn đúng Binh Pháp chapter → dùng đúng ClaudeKit command.

---

## THẬP TAM THIÊN → CLAUDEKIT COMMANDS

| Ch. | Binh Pháp | Tình huống thực tế | ClaudeKit Command | Ví dụ |
|-----|-----------|-------------------|-------------------|-------|
| 1 始計 | Đánh giá trước khi hành động | Nhận task mới, cần hiểu scope | `/ask` | `/ask "how does auth work in this project?"` |
| 2 作戰 | Token budget, tốc chiến | Task đơn giản, cần nhanh | `/cook --auto` | `/cook "fix typo in README" --auto` |
| 3 謀攻 | Dùng mưu, plan trước khi code | Task phức tạp, cần architect | `/plan:hard` | `/plan:hard "migrate from REST to GraphQL"` |
| 4 軍形 | Phòng thủ, fix bugs trước | Bug, security, CI đỏ | `/debug` | `/debug "build failing after migration"` |
| 5 兵勢 | Tích lũy thế, phóng đúng lúc | Queue tasks, batch execution | `/plan:parallel` | `/plan:parallel "audit all 5 projects"` |
| 6 虛實 | Tránh mạnh đánh yếu, routing | Model routing, resource mgmt | `/cook` + model flag | CTO tự chọn Opus/Sonnet/Flash |
| 7 軍爭 | Hành quân nhanh, tranh lợi thế | Sprint execution, deploy | `/cook` | `/cook "implement feature X as planned"` |
| 8 九變 | 9 biến linh hoạt, fallback | Error recovery, plan B | `/plan:two` | `/plan:two "add caching — Redis vs memory"` |
| 9 行軍 | Đọc dấu hiệu, trinh sát | Health check, log analysis | `/review` | `/review` hoặc `/test` |
| 10 地形 | Phân loại project terrain | Monorepo vs micro, complexity | `/ask` | `/ask "what type of project is this?"` |
| 11 九地 | 9 tình thế chiến lược | Dev→staging→prod pipeline | `/plan:ci` | `/plan:ci` (analyze CI failures) |
| 12 火攻 | Push đúng lúc, safety gate | Deploy, git push | `/check-and-commit` | `/check-and-commit` |
| 13 用間 | Tình báo, trinh sát | Research, docs, competitor | `/plan:parallel` + researcher | CTO dispatch researcher agents |

---

## WORKFLOW CHUẨN THEO BINH PHÁP

### Task ĐƠN GIẢN (GIÓ 🌬️ — 15 phút)
```
始計: /ask → 作戰: /cook --auto → 火攻: /check-and-commit
```

### Task TRUNG BÌNH (RỪNG 🌲 — 30 phút)
```
始計: /ask → 謀攻: /plan:fast → 軍爭: /cook → 行軍: /test → 火攻: /check-and-commit
```

### Task PHỨC TẠP (LỬA 🔥 — 45 phút)
```
始計: /ask → 謀攻: /plan:hard → 軍形: /debug (nếu cần) → 軍爭: /cook → 行軍: /review → 火攻: /check-and-commit
```

### Task CHIẾN LƯỢC (NÚI ⛰️ — 120 phút)
```
用間: /plan:parallel → 謀攻: /plan:hard → 兵勢: /plan:two → 軍爭: /cook → 行軍: /review:codebase → 火攻: /check-and-commit
```

---

## MISSION-DISPATCHER PHẢI KIỂM TRA

Khi CTO dispatch task cho CC CLI, PHẢI wrap bằng ClaudeKit command:

| Complexity | ClaudeKit Command | Binh Pháp |
|-----------|-------------------|-----------|
| SIMPLE | `/cook "task" --auto` | 作戰 tốc chiến |
| MEDIUM | `/cook "task"` | 軍爭 hành quân |
| COMPLEX | `/plan:hard "task"` rồi `/cook` | 謀攻 mưu công |
| DEBUG | `/debug "issue"` | 軍形 phòng thủ |
| REVIEW | `/review` | 行軍 trinh sát |

---

## RULE CẤM QUÊN

1. **KHÔNG BAO GIỜ** gửi raw text cho CC CLI — PHẢI dùng `/command`
2. **Antigravity KHÔNG ĐƯỢC** inject trực tiếp vào CC CLI — chỉ tạo task files
3. **CC CLI chỉ nhận lệnh từ CTO** (task-watcher → mission-dispatcher → brain)
4. **Mọi mission PHẢI ánh xạ** ít nhất 1 chapter Binh Pháp
5. **BINH_PHAP_MASTER.md = hoa tiêu** — đọc trước khi hành động

---

_Created: 2026-02-17 | Author: Antigravity (Mentor) | 🦞_
