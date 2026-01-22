# 🏯 Chiến Dịch Đại Cấu Trúc (The Great Refactoring)

> **Mục tiêu:** Refactor 100% codebase, triệt tiêu nợ kỹ thuật, và chuẩn hóa kiến trúc theo hệ tư tưởng "Binh Pháp Agency OS".

---

## 1. Phân Tích (Diagnosis)

| Khu vực | Hiện trạng | Vấn đề (Nợ kỹ thuật) | Mục tiêu (Binh Pháp) |
|---------|------------|----------------------|----------------------|
| **Backend Core** (`core/`) | 70+ file Python phẳng (Flat structure) | "God Class", khó bảo trì, khó test. | **Chia Để Trị:** Modularize thành các domain (CRM, Finance, HR...). |
| **Frontend** (`apps/`) | 2 Next.js apps (`web`, `dashboard`) | UI component chưa đồng nhất, styling rời rạc. | **Hình Thế:** Standardized UI/UX, Vibe "Startup + Strategy". |
| **Architecture** | Script-based, Blocking I/O | Thiếu tính mở rộng, hiệu năng thấp. | **Tốc Chiến:** Async First, Event-Driven Architecture. |
| **Standards** | Thiếu linting/formatting chặt chẽ | Code style không đồng nhất. | **Quân Luật:** Strict Linting (Ruff, ESLint). |

---

## 2. Kế Hoạch Chiến Lược (Strategic Plan)

Chiến dịch chia làm 4 giai đoạn (Phases):

### 🏳️ Phase 1: Quân Luật (Standardization)
> *Trước khi đánh trận, quân đội phải nghiêm chỉnh.*

1.  **Cấu trúc thư mục chuẩn:**
    *   `core/` -> `core/modules/` (Chứa logic nghiệp vụ).
    *   `core/shared/` (Chứa utils, helpers).
    *   `core/infrastructure/` (DB, External APIs).
2.  **Linting & Formatting:**
    *   Backend: Cấu hình `ruff` (thay thế Flake8/Black).
    *   Frontend: Cấu hình `ESLint` + `Prettier`.
3.  **Documentation:**
    *   Update `README.md` chính.
    *   Tạo `CONTRIBUTING.md`.

### 🛡️ Phase 2: Tướng Lĩnh (Core Refactoring)
> *Chia nhỏ quân đội, cử tướng tài cai quản.*

Refactor thư mục `core/*.py` thành các modules độc lập:

*   `core/crm.py` -> `core/modules/crm/` (Models, Services, Views).
*   `core/finance.py` -> `core/modules/finance/`.
*   ... và các file khác.

Mỗi module tuân thủ **Clean Architecture**:
*   `entities/`: Data structures (Pydantic/Dataclasses).
*   `use_cases/`: Business Logic.
*   `interfaces/`: APIs/CLI adapters.

### 🏯 Phase 3: Hình Thế (UI/UX Renovation)
> *Xây dựng thành trì đẹp và vững chắc.*

1.  **Design System:**
    *   Tạo thư viện component chuẩn (`ui-kit`) dùng chung cho `web` và `dashboard`.
    *   Áp dụng Tailwind CSS + Shadcn UI (nếu có thể).
2.  **Vibe Tuning:**
    *   Update màu sắc, typography theo style "AgencyOS" (Strategic, Technical).
    *   Thêm Micro-interactions.
3.  **Performance:**
    *   Lazy loading, Image optimization.

### 🔥 Phase 4: Hỏa Công (Optimization & Automation)
> *Tấn công nhanh, mạnh.*

1.  **Async/Parallelism:** Chuyển đổi các tác vụ blocking sang async.
2.  **Caching:** Implement caching layer (Redis/Memory).
3.  **Testing:** Tăng coverage lên > 80%.

---

## 3. Lộ Trình Thực Thi (Execution Steps)

### Bước 1: Khởi động (Setup)
- [ ] Tạo cấu trúc thư mục mới: `core/modules`, `core/shared`.
- [ ] Cài đặt `ruff` và cấu hình `pyproject.toml`.

### Bước 2: Refactor Module CRM (Pilot)
- [ ] Di chuyển `core/crm.py` vào `core/modules/crm/`.
- [ ] Tách `Contact`, `Deal` ra `entities.py`.
- [ ] Tách Logic ra `services.py`.
- [ ] Viết Unit Test cho CRM mới.

### Bước 3: Refactor Module Finance
- [ ] Tương tự CRM, refactor `financial_reports.py`.

### Bước 4: Apply UI Changes
- [ ] Review `apps/dashboard`.
- [ ] Update Layout chính.

---

## 4. Cam Kết (Commitment)
- 100% Code được linting.
- Không còn file Python quá 200 dòng trong `core/`.
- UI đồng nhất về Vibe.