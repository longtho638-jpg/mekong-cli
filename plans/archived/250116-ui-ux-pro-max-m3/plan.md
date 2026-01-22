# 🎨 Plan: UI/UX Pro Max (Material Design 3 Strict)

> **Ref:** [ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
> **Library:** [material-components](https://github.com/material-components)
> **Architecture:** [m3.material.io](https://m3.material.io/)
> **Goal:** Đồng bộ hóa tuyệt đối giao diện theo chuẩn Google Material Design 3 (M3) cho cả Dev và User Non-tech.

## 1. Chiến Lược (Binh Pháp)

*   **Đạo (Design System):** Sử dụng **M3 Design Tokens** làm ngôn ngữ chung. Không dùng "Magic numbers" (px tùy tiện). Mọi màu sắc, khoảng cách, typography đều phải map về Token.
*   **Pháp (Implementation):** Xây dựng bộ `MD3 Component Library` trong dự án.
*   **Tướng (Orchestration):** Agent `UI Architect` sẽ chỉ đạo việc lắp ghép các component này.

## 2. Kế Hoạch Thực Thi (Execution)

### Phase 1: M3 Foundation (Nền Móng)
*   **Tokens:** Tạo `apps/dashboard/styles/md3-tokens.css` chứa toàn bộ biến CSS chuẩn M3 (Sys Color, Ref Palette, Typography, Elevation).
*   **Tailwind Config:** Map Tailwind config vào các biến CSS này để Dev có thể dùng `bg-surface-container` thay vì `bg-gray-100`.

### Phase 2: MD3 Component Core (Vũ Khí)
Xây dựng các component chuẩn "Pro Max" tại `apps/dashboard/components/md3/`:
*   `MD3Button`: Filled, Outlined, Text, Elevated, Tonal.
*   `MD3Card`: Elevated, Filled, Outlined.
*   `MD3Navigation`: Navigation Rail/Bar chuẩn M3.
*   `MD3TopAppBar`: Center/Small/Medium/Large.

### Phase 3: The "UI Architect" Skill (Trí Tuệ)
Tạo module `core/modules/ui_architect/`:
*   Logic để AI hiểu cách lắp ghép các `MD3 Component` thành một Page hoàn chỉnh.
*   CLI Command: `agencyos ui page "Dashboard"` -> Output code React dùng `MD3*` components.

### Phase 4: Mapping .claude (Luật)
*   Tạo rule `.claude/rules/m3-strict.md`: Cấm AI dùng thẻ HTML trần (`<div>`, `<button>`) mà phải dùng `MD3*` components.

## 3. Implementation Steps

1.  **Setup Tokens:** `apps/dashboard/styles/md3-tokens.css`
2.  **Config Tailwind:** `apps/dashboard/tailwind.config.js`
3.  **Build Components:** `apps/dashboard/components/md3/*`
4.  **Create Skill:** `core/modules/ui_architect/`
5.  **CLI Integration:** `agencyos ui ...`

## 4. Output Artifacts

*   `apps/dashboard/styles/md3-tokens.css`
*   `apps/dashboard/components/md3/`
*   `core/modules/ui_architect/`
*   `.claude/rules/m3-strict.md`
