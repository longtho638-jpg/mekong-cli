# 🏯 Rules: Architecture First (Luật Móng Nhà)

> **Mục tiêu:** Ngăn chặn việc tạo ra "code rỗng ruột" (Spaghetti code, UI-only apps).

## 1. Quy Tắc "Ngũ Sự" Trong Code

Trước khi viết bất kỳ dòng code backend nào, Agent phải xác định:

1.  **Đạo (Domain):** Nghiệp vụ chính là gì? (e.g., E-commerce, Booking).
2.  **Thiên (Scale):** Quy mô dự kiến? (MVP nhanh hay Enterprise lâu dài).
3.  **Địa (Tech Stack):** Framework nào? (Next.js, NestJS, Python/FastAPI).
4.  **Tướng (Architecture):** Pattern nào sẽ dùng? (MVC, Clean Arch, Hexagonal).
5.  **Pháp (Structure):** Cấu trúc thư mục cụ thể.

## 2. Decision Matrix (Ma Trận Quyết Định)

| Loại Dự Án | Độ Phức Tạp | Kiến Trúc Đề Xuất | Reference Repo |
| :--- | :--- | :--- | :--- |
| **Landing Page / Simple UI** | Thấp | Component-based | Shadcn UI |
| **MVP App (CRUD)** | Trung bình | Layered (Controller -> Service -> Repo) | `talyssonoc/node-api` |
| **SaaS Product** | Cao | Clean Architecture | `Melzar/clean-nextjs` |
| **Enterprise Core** | Rất cao | Hexagonal + DDD | `Sairyss/dd-hexagon` |
| **High Traffic / Audit** | Cực cao | CQRS + Event Sourcing | `bitloops/ddd-cqrs` |

## 3. Mandatory Steps (Các Bước Bắt Buộc)

Khi user yêu cầu "Code backend" hoặc "Thêm tính năng phức tạp":

1.  **Stop:** Không viết code ngay.
2.  **Ask:** Xác định độ phức tạp domain.
3.  **Select:** Chọn Repo mẫu từ `docs/architecture/top-tier-repos.md`.
4.  **Scaffold:** Tạo cấu trúc thư mục trước (Interfaces, DTOs, Entities).
5.  **Implement:** Mới viết logic chi tiết.

## 4. Anti-Patterns (Cấm Kỵ)

*   ❌ Gọi Database trực tiếp từ Controller/API Route.
*   ❌ Viết Business Logic trong UI Components.
*   ❌ Sử dụng `any` bừa bãi.
*   ❌ Không có DTO (Data Transfer Object) cho Input/Output.
