---
description: CC CLI Next Gen Upgrade Protocol - Binh Pháp Strategy
---

# 🏯 CC CLI Upgrade Protocol

> **Shortcut:** `/run upgrade-protocol`
> **Strategy:** Binh Pháp - "Còn sống là còn nâng cấp"

---

## Giai đoạn 1: PLANNING (Architecture & Strategy)

### Vai trò

Bạn là **Chief Architect & Strategic Commander** của hệ thống AgencyOS.

### Bối cảnh chiến lược

- Cuộc đua bất tận ("Infinite Game")
- Mục tiêu: Thống trị thị trường, đối thủ không đuổi kịp
- Nguyên tắc: "Còn sống là còn nâng cấp" - Không chấp nhận trạng thái tĩnh

### Nhiệm vụ phân tích

#### 1. Speed Dominance (Hiệu năng)

- Rà soát bottlenecks hiện tại
- Đề xuất tối ưu để latency < 100ms
- Lazy loading, async operations, caching

#### 2. Feature Expansion (Mở rộng tính năng)

- Thêm lệnh mới cho AgencyOS automation
- Tích hợp sâu với các module khác
- API contracts rõ ràng

#### 3. Anti-Fragile Architecture (Kiến trúc bền vững)

- Refactor để dễ mở rộng (plugin system)
- Logging/monitoring toàn diện
- "Dừng lại thở" để kiểm soát, không phải sửa lỗi

#### 4. GO-LIVE Roadmap

- Các bước triển khai cụ thể
- Rollback strategy
- Monitoring alerts

### Output

- Cập nhật `implementation_plan.md`
- Tạo `task.md` với atomic tasks

---

## Giai đoạn 2: EXECUTION (Thực thi & Chinh phạt)

### Chỉ thị thực thi

// turbo-all

1. **Chế độ:** Fast Mode / Turbo
2. **Tuân thủ:**
    - Thực hiện chính xác các đầu mục trong `task.md`
    - Áp dụng quy tắc `.agent/rules/` (Clean Code, SOLID)
3. **Kiểm soát:**
    - Sau mỗi module hoàn thành, tự động chạy test
    - Nếu gặp lỗi, tự động sửa (Self-healing)
4. **Mục tiêu cuối:**
    - Code sẵn sàng merge và deploy
    - Tạo `walkthrough.md` báo cáo kết quả

---

## Quick Reference

### Commands

```bash
# Run this workflow
/run upgrade-protocol

# Check current CLI status
./scripts/cc --version
./scripts/cc --help

# Run tests
pytest tests/test_cc_*.py -v

# Benchmark performance
python tests/benchmark_cli.py
```

### Key Files

- `implementation_plan.md` - Architecture blueprint
- `task.md` - Atomic task list
- `.agent/CLAUDE_INSTRUCTIONS.md` - Handoff protocol
- `scripts/cc_*.py` - CLI implementations

### Success Criteria

- [ ] All CLIs respond to --help < 100ms
- [ ] All tests passing
- [ ] CI/CD workflow valid
- [ ] Documentation complete
- [ ] Go-Live ready

---

## Usage Example

```
User: /run upgrade-protocol
Antigravity: [Analyzes codebase, creates plan]
User: Approved
Antigravity: [Executes tasks in TURBO mode]
Antigravity: [Creates walkthrough.md with results]
```
