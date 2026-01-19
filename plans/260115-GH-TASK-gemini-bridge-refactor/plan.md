# 🏯 Chiến Lược: Refactor Gemini Bridge (Dụng Gián)

> **Mục tiêu:** Triệt tiêu nợ kỹ thuật, tối ưu hóa hiệu năng và ánh xạ kiến trúc AgencyOS cho `gemini-bridge.cjs`.

## 1. Phân Tích Hiện Trạng (Diagnosis)

| Yếu tố | Tình trạng hiện tại | Đánh giá (Nợ kỹ thuật) |
|--------|---------------------|------------------------|
| **Hiệu năng** | `execSync` (Blocking) | 🔴 Cao: Chặn event loop, làm chậm ứng dụng khi chờ API. |
| **Cấu trúc** | Monolithic function | 🟠 Trung bình: Khó mở rộng, khó test. |
| **Độ tin cậy** | Basic Try/Catch | 🟠 Trung bình: Xử lý lỗi chưa triệt để. |
| **Kiến trúc** | Script rời rạc | 🟠 Trung bình: Chưa theo chuẩn OOP/Module của hệ thống. |

## 2. Chiến Lược Refactoring (Strategy)

Áp dụng tư duy **"Chia để trị"** và **"Binh Pháp"**:

### 2.1. Kiến trúc mới (Proposed Architecture)
Chuyển đổi từ Procedural sang OOP với các thành phần:

1.  **`RateLimiter` Class:** Quản lý quota và thời gian chờ (Tách biệt "Pháp").
2.  **`GeminiBridge` Class:** Quản lý luồng xử lý chính (Tách biệt "Tướng").
3.  **`Utils` Module:** Các hàm hỗ trợ (Log, File I/O).

### 2.2. Tối ưu hóa (Optimization)
-   **Async First:** Thay thế toàn bộ `execSync` bằng `spawn` + `Promise` để không block main thread.
-   **Structured State:** Lưu state vào `~/.gemini/bridge-state.json` hoặc đường dẫn config chuẩn thay vì `__dirname`.
-   **Type Safety:** Thêm JSDoc đầy đủ.

## 3. Kế Hoạch Thực Thi (Implementation Plan)

### Bước 1: Chuẩn bị (Preparation)
-   [ ] Backup file hiện tại.
-   [ ] Tạo khung Class structure.

### Bước 2: Refactoring Core (The Engine)
-   [ ] Implement `RateLimiter` class (Token Bucket/Window).
-   [ ] Implement `GeminiExecutor` với `spawn` async.

### Bước 3: Refactoring Commands (The Interface)
-   [ ] Viết lại các hàm `cmdAsk`, `cmdVision`, `cmdCode` sử dụng Class mới.
-   [ ] Chuẩn hóa output (Logs) theo style "Binh Pháp" (Emoji, Structure).

### Bước 4: Kiểm thử (Verification)
-   [ ] Chạy `test-rate-limit`.
-   [ ] Test thử lệnh `ask` (Mock hoặc Real).

## 4. Minh họa Code (Preview)

```javascript
/**
 * @class GeminiBridge
 * @description Quản lý kết nối và điều phối agent
 */
class GeminiBridge {
    constructor(config) {
        this.limiter = new RateLimiter(config);
    }

    async ask(prompt) {
        await this.limiter.wait();
        return this.execute('ask', prompt);
    }
}
```

## 5. Kết quả mong đợi (Outcome)
-   ✅ **Hiệu năng:** Không còn blocking I/O.
-   ✅ **Bảo trì:** Code dễ đọc, dễ mở rộng.
-   ✅ **Chuẩn hóa:** Tuân thủ quy tắc "Data Diet" và "Vibe" của AgencyOS.
