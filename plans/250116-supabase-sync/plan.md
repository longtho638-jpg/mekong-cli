# 🗄️ Plan: Supabase Synchronization (Core Modules)

> **Goal:** Đồng bộ hóa Database Schema (Supabase) với kiến trúc Modular mới của AgencyOS. Chuyển đổi từ "Mock Data" sang "Real Persistence".

## 1. Phân Tích (Diagnosis)

*   **Hiện tại:**
    *   Backend (`core/modules`) đã được refactor sang Clean Architecture.
    *   Tuy nhiên, các service (`CRMService`, `InvoiceSystem`) vẫn chủ yếu dùng dữ liệu giả (Mock) hoặc chưa kết nối sâu với Supabase.
    *   `core/infrastructure/database.py` đã có Singleton Client, nhưng chưa được tận dụng triệt để.
*   **Yêu cầu:**
    *   Cần file Migration chuẩn (`.sql`) cho các module cốt lõi: CRM, Invoice.
    *   Cần cập nhật logic Service để Read/Write vào DB.

## 2. Chiến Lược Thực Thi (Execution)

### Phase 1: Schema Design (Bản Vẽ)
Tạo file migration `supabase/migrations/20240116_init_agencyos.sql` bao gồm:
*   **CRM:** `contacts`, `deals`
*   **Finance:** `invoices`, `invoice_items`
*   **RLS (Row Level Security):** Đảm bảo bảo mật cơ bản (tạm thời public cho dev mode hoặc authenticated).

### Phase 2: Logic Integration (Kết Nối)
Update `core/modules/crm/services.py`:
*   Inject `SupabaseClient` vào `CRMService`.
*   Thay thế `self.contacts = {}` bằng `self.db.table('contacts').select(...)`.
*   Thêm cơ chế Fallback: Nếu không có DB connection -> Dùng Mock Data (để không break user mới).

### Phase 3: Developer Experience (Tiện Ích)
*   Tạo script `scripts/setup_supabase.sh` (hoặc hướng dẫn) để user biết cách link project.

## 3. Implementation Steps

1.  **Migration:** Tạo `supabase/migrations/20240116_init_core.sql`.
2.  **CRM Update:** Refactor `CRMService` để dùng DB thật.
3.  **Invoice Update:** Refactor `InvoiceSystem` để dùng DB thật.
4.  **CLI Check:** Đảm bảo `agencyos crm` vẫn chạy tốt (dù có hay không có DB).

## 4. Output Artifacts

*   `supabase/migrations/20240116_init_core.sql`
*   `core/modules/crm/services.py` (Updated)
*   `core/modules/invoice/services.py` (Updated)
