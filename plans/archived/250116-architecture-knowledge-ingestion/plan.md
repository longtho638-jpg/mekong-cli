# 🏗️ Plan: Ingest Top-Tier Architecture Knowledge

> **Goal:** "Nạp" (Ingest) kiến trúc chuẩn (Clean Architecture, DDD, Hexagonal) vào bộ nhớ của AgencyOS để AI không sinh ra "code rỗng ruột".

## 1. Phân Tích (Binh Pháp)

*   **Vấn đề:** "Vibe coding" thường chỉ tạo ra bề nổi (UI/Frontend) tốt, nhưng thiếu chiều sâu (Backend logic, Scalability).
*   **Giải pháp:** Cung cấp "Bản vẽ móng" (Architecture Blueprints) từ các repo chuẩn mực thế giới.
*   **Chiến thuật:** Lưu trữ các pattern này dưới dạng *Knowledge Base* và *Templates* để Agent (Planner/Architect) tham chiếu trước khi viết code.

## 2. Kế Hoạch Thực Thi (Implementation)

### Phase 1: Knowledge Base (Tàng Kinh Các)
- [ ] Tạo `docs/architecture/top-tier-repos.md`: Lưu danh sách 6 repo "xịn" kèm phân tích chi tiết *Tại sao* và *Khi nào dùng*.
- [ ] Tạo `docs/architecture/clean-architecture-map.md`: Mapping thư mục chuẩn (Domain -> Application -> Infra).

### Phase 2: Agent DNA (Tư Duy Kiến Trúc)
- [ ] Tạo `.agencyos/agents/rules/architect.md`: Luật bất biến - "Không code khi chưa có bản vẽ".
- [ ] Định nghĩa quy tắc chọn Architecture dựa trên loại dự án (Simple CRUD vs Complex Domain).

### Phase 3: Templates (Khuôn Mẫu)
- [ ] Tạo `templates/architecture/structure_backend.txt`: Cấu trúc thư mục chuẩn cho Backend.
- [ ] Tạo `templates/architecture/structure_nextjs.txt`: Cấu trúc chuẩn cho Next.js Clean Arch.

### Phase 4: CLI Integration (Công Cụ)
- [ ] Tạo command `/arch` để list các reference này ngay trong terminal.

## 3. Output Artifacts

1.  `docs/architecture/top-tier-repos.md`
2.  `.agencyos/rules/architecture-first.md`
3.  `.agencyos/commands/arch.md`
4.  `templates/architecture/domain_driven_structure.md`

## 4. Mapping .claude
Các file này sẽ được mapping vào Context Window của Claude/Gemini khi chạy lệnh `/arch` hoặc khi kích hoạt agent `architect`.
