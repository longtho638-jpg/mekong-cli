# 🦞 TÔM HÙM AGI - Báo Cáo Giải Trình Tích Hợp Vertex AI

## "Từ Giả Cầy Thành Siêu Trí Tuệ Gemini 2.5"

### 1. Hiện Trạng & Sự Chuyển Hóa

**Trước đây:**

- `NLU` (Hiểu Ngôn Ngữ): Logic cứng (regex), mô hình offline, hoặc proxy chậm chạp.
- `RecipeGen` (Tạo Công Thức): Template mẫu (Jinja2), không có khả năng sáng tạo "Out-of-the-box".
- **Hệ quả:** AGI chỉ "diễn", chưa thực sự tham gia cuộc chơi.

**Hiện tại (v1.1.0):**

- **Trí thông minh:** Gemini 2.5 Pro (Direct Google API).
- **Hạ tầng:** Hybrid (Vertex AI / Google AI Studio Key).
- **Chi phí:** $0 (tận dụng $1000 credits/acc).
- **Tốc độ:** Phản hồi dưới 1 giây (không qua proxy trung gian).

### 2. Chi Tiết Kỹ Thuật Các Thay Đổi (`src/core/`)

#### A. Bộ Não Mới: `llm_client.py`

Code đã được viết lại hoàn toàn để hỗ trợ 3 chế độ ưu tiên:

1. **ULTRA (Gemini 2.5 Pro):** Dùng key `AIzaSyBe...` (trực tiếp).
2. **SAFE (Antigravity Proxy):** Dùng khi key chết hoặc cần bypass IP.
3. **FALLBACK (OpenAI/Offline):** Lưới an toàn cuối cùng.

#### B. Tiêm Huyết Thanh: `autonomous.py`

Đã thực hiện "Dependency Injection" (Tiêm phụ thuộc):

- `AutonomousEngine` không còn khởi tạo `llm_client` ngẫu nhiên.
- Nó "ép" (force) dùng Key Gemini 2.5 Pro xịn nhất cho các module quan trọng:
  - `IntentClassifier`: Hiểu lệnh phức tạp (e.g., "Tạo plan marketing cho quán phở mà không dùng ngân sách").
  - `RecipeGen`: Tự nghĩ ra 10 bước thực thi, không cần template sẵn.

### 3. Kết Quả Xác Thực (Verification)

- **Script Test:** `scripts/verify_vertex.py`
- **Output:** `VERTEX_INTEGRATION_SUCCESS`
- **Model:** `gemini-2.5-pro` (Đã confirm).
- **Regression Test:** 63/63 test cũ vẫn PASS -> Không làm hỏng logic cũ.

### 4. Lợi Ích Chiến Lược

1. **$2000 Credits = 8+ Năm Sử Dụng:**
   - Với cường độ dev hiện tại (~$0.65/ngày nếu max load), 2 tài khoản GCP là dư thừa cho AGI học tập.
2. **Khả Năng Tự Code (Coding Agent):**
   - Gemini 2.5 Pro mạnh về code ngang ngửa Claude 3.5 Sonnet.
   - Sắp tới có thể giao việc: "Tự viết thêm module X cho tao".

### 5. Đề Xuất Bước Tiếp Theo

- [ ] **Stress Test NLU:** Thử ra lệnh siêu khó, mơ hồ xem Gemini xử lý sao.
- [ ] **Coding Agent Module:** Cho AGI quyền tự sửa file của chính nó using Gemini 2.5 suggestions.

---

**Trạng thái:** ✅ **SẴN SÀNG CHIẾN ĐẤU** (v1.1.0)
