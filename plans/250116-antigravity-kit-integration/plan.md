# 🌌 Plan: Antigravity Kit Integration (Max Level)

> **Ref:** [vudovn/antigravity-kit](https://github.com/vudovn/antigravity-kit)
> **Goal:** Tích hợp sâu "Antigravity Kit" làm SDK cốt lõi (The Kernel) cho toàn bộ dự án.
> **Target:** Dev (dùng SDK) & AgencyER (dùng Features).

## 1. Concept (Tư Duy)

**Antigravity Kit** không chỉ là code, nó là **"Vũ Khí Hạng Nặng"** (Heavy Weaponry) của AgencyOS.
Nó đóng gói các logic phức tạp (CRM, Finance, Strategy) thành các "Kit Modules" dễ dùng.

*   **For Dev:** `import { AgencyDNA } from 'antigravity-kit'`
*   **For User:** "Kích hoạt module AgencyDNA" (Click/Command).

## 2. Architecture Map (Bản Đồ)

### Layer 1: The Kit (SDK)
Tạo `packages/antigravity-kit/` (giả lập hoặc submodule) hoặc tích hợp thẳng vào `core/antigravity_kit/`.
Để phù hợp với monorepo hiện tại, ta sẽ đặt tại `core/modules/antigravity_kit`.

Modules cần có (Standardize):
1.  **AgencyDNA:** Quản lý Identity, Vibe, Niche.
2.  **ClientMagnet:** Lead Gen & CRM Wrapper.
3.  **RevenueEngine:** Finance Wrapper.
4.  **ContentFactory:** Content Generator Wrapper.
5.  **FranchiseManager:** Quản lý mở rộng (Scale).

### Layer 2: CLI Adapter
Command `/kit`:
*   `/kit install <module>`: Kích hoạt module.
*   `/kit status`: Xem sức khỏe hệ thống.
*   `/kit sync`: Đồng bộ dữ liệu.

### Layer 3: Dashboard Integration
*   Thêm "Antigravity Hub" vào Dashboard.
*   Hiển thị các module dưới dạng "Cards" (Activated/Inactive).

### Layer 4: .claude Mapping
*   Rule: Khi User hỏi về "Scale" -> Dùng `FranchiseManager`.
*   Rule: Khi User hỏi về "Tiền" -> Dùng `RevenueEngine`.

## 3. Implementation Plan

### Phase 1: Core Kit Construction (Chế Tạo)
- [ ] Tạo `core/modules/antigravity_kit/`.
- [ ] Implement `AgencyDNA`, `ClientMagnet`, `RevenueEngine` (Wrap các module cũ).

### Phase 2: CLI Integration (Vũ Khí)
- [ ] Tạo command `agencyos kit`.
- [ ] Update `main.py`.

### Phase 3: Developer Experience (Dev)
- [ ] Tạo file `ANTIGRAVITYKIT_README.md` hướng dẫn dùng SDK.

### Phase 4: User Experience (User)
- [ ] Cập nhật Dashboard để hiển thị trạng thái Kit.

## 4. Output Artifacts

1.  `core/modules/antigravity_kit/`
2.  `ANTIGRAVITYKIT_README.md`
3.  `.agencyos/commands/kit.md`
4.  Updates to `cli/main.py`
