# Kiến Trúc Hệ Thống: AgencyOS RaaS

## 1. Tổng Quan Cấp Cao (Hub-and-Spoke)

Nền tảng AgencyOS Robot-as-a-Service (RaaS) tuân theo kiến trúc Hub-and-Spoke, được thiết kế cho khả năng mở rộng cao, phân tách mối quan tâm và xử lý bất đồng bộ.

### Sơ Đồ Kiến Trúc

```mermaid
graph TD
    User[User / Telegram] -->|File IPC / Tasks| TomHum[🦞 Tôm Hùm Daemon (OpenClaw)]

    subgraph "Hub Layer (Orchestration)"
        TomHum -->|1. Dispatch Task| Queue[(Task Queue)]
        TomHum -->|2. Spawn/Manage| Brain[Brain Process (CC CLI)]
        TomHum -->|3. Auto-CTO| Quality[Quality Gates]
    end

    subgraph "Spoke Layer (Execution)"
        Brain -->|4. Execute Plan| FS[File System]
        Brain -->|5. Git Ops| Git[Git Repository]
        Brain -->|6. LLM Calls| Proxy[Antigravity Proxy :9191]
    end

    subgraph "Infrastructure Layer"
        Proxy -->|Load Balance| Providers[Anthropic / Gemini / OpenAI]
        FS -->|Logs & Telemetry| Dashboard[Observability]
    end
```

## 2. Các Thành Phần Cốt Lõi

### 2.1. Tôm Hùm Daemon (OpenClaw Worker)
- **Vị trí**: `apps/openclaw-worker/`
- **Vai trò**: "Đại Tướng" - Điều phối viên trung tâm.
- **Trách nhiệm**:
  - Giám sát thư mục `tasks/` để nhận nhiệm vụ mới.
  - Quản lý vòng đời của tiến trình Brain (CC CLI).
  - Tự động sinh ra các nhiệm vụ bảo trì (Auto-CTO) khi rảnh rỗi.
  - Bảo vệ tài nguyên hệ thống (M1 Cooling Daemon).
- **Mô-đun mới (L11-L12)**:
  - `clawwork-integration.js`: Tích hợp ClawWork cho phân tích kết quả & insight.
  - `moltbook-integration.js`: Tích hợp Moltbook để quản lý agent identity & metadata.
  - Cải tiến `self-analyzer.js`: Hỗ trợ cross-session memory persistence.
  - `vector-service.js`: Dự phòng local embedding khi vector DB không khả dụng.

### 2.2. CC CLI (Claude Code)
- **Vị trí**: Chạy dưới dạng tiến trình con của Tôm Hùm.
- **Vai trò**: "Binh Sĩ" - Đơn vị thực thi.
- **Trách nhiệm**:
  - Nhận lệnh thông qua `stdin` (được inject bởi Tôm Hùm).
  - Thực thi các lệnh `mekong cook`, `mekong plan`.
  - Tương tác trực tiếp với File System và Git.
  - Báo cáo kết quả về Tôm Hùm thông qua file IPC.

### 2.3. Antigravity Proxy
- **Cấu hình**: Port `9191`.
- **Vai trò**: Cổng kết nối LLM tập trung.
- **Trách nhiệm**:
  - Cân bằng tải giữa các tài khoản và nhà cung cấp LLM.
  - Quản lý hạn ngạch (Quota management).
  - Tự động chuyển đổi (Failover) khi một model bị lỗi.
  - Đảm bảo tính ẩn danh và ổn định cho các agent.

### 2.4. RaaS Gateway (Cloudflare Workers)
- **Vị trí**: `apps/raas-gateway/`
- **Vai trò**: API Gateway cho các yêu cầu từ bên ngoài (Web, Webhook).
- **Trách nhiệm**:
  - Xác thực API Key.
  - Chuyển đổi HTTP Request thành File Task cho Tôm Hùm.

## 3. Luồng Dữ Liệu (Data Flow)

### Quy trình Xử lý Nhiệm vụ (Task Processing)
1.  **Nhận Nhiệm Vụ**: User hoặc hệ thống tạo file `tasks/mission_*.txt`.
2.  **Phát Hiện**: Tôm Hùm phát hiện file mới, đọc nội dung.
3.  **Lập Lịch**: Tôm Hùm đẩy nhiệm vụ vào hàng đợi ưu tiên.
4.  **Thực Thi**:
    - Tôm Hùm gọi CC CLI (Brain).
    - CC CLI phân tích yêu cầu, gọi Proxy để lấy Plan.
    - CC CLI thực thi các bước (sửa code, chạy test).
5.  **Kiểm Tra (Verify)**:
    - CC CLI chạy các kiểm tra Binh Pháp (Lint, Test, Build).
    - Nếu thất bại -> Rollback hoặc Fix.
    - Nếu thành công -> Báo cáo "DONE".
6.  **Hoàn Tất**: Tôm Hùm di chuyển file task vào `tasks/processed/`.

## 4. Mô Hình Dữ Liệu

### Task File Structure
```text
Filename: mission_PROJECT_TIMESTAMP.txt
Content:
- Project: <tên-dự-án>
- Priority: <HIGH/LOW>
- Description: <mô-tả-chi-tiết>
```

### Database (PostgreSQL)
Lưu trữ thông tin người dùng, tín dụng (credits) và lịch sử giao dịch (dành cho lớp Web).

## 5. Bảo Mật & An Toàn

- **Sandbox**: CC CLI chạy trong môi trường được kiểm soát quyền (mặc dù cờ `--dangerously-skip-permissions` được bật để tự động hóa, nhưng Tôm Hùm giám sát chặt chẽ).
- **Network Isolation**: Proxy chỉ cho phép các kết nối từ localhost hoặc các IP tin cậy.
- **Resource Limits**: Daemon giám sát RAM và Nhiệt độ CPU để ngăn chặn quá tải trên thiết bị Edge (MacBook M1).
