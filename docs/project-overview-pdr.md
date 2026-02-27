# Tổng Quan Dự Án & Yêu Cầu Phát Triển Sản Phẩm (PDR)

**Phiên bản:** 2.1.0
**Dựa trên:** `MASTER_PRD.md`

## 1. Tổng Quan Dự Án
**AgencyOS (Mekong CLI)** là nền tảng Robot-as-a-Service (RaaS) được thiết kế để chuyển đổi mô hình agency từ dựa trên dịch vụ sang dựa trên kết quả (outcome-based). Hệ thống sử dụng kiến trúc Hub-and-Spoke để điều phối các AI agent nhằm cung cấp kết quả hữu hình (leads, nội dung, báo cáo) thay vì chỉ cung cấp công cụ.

### Triết Lý Cốt Lõi
> "Chúng ta không bán công cụ. Chúng ta bán Kết Quả (Deliverables)."

### Các Thành Phần Chính
1.  **Lớp Tài Chính (Spoke 1)**: Nền tảng web Next.js dành cho chủ agency (non-tech) để mua tín dụng và đặt hàng kết quả.
2.  **Lớp Lan Truyền (Spoke 2)**: Bộ công cụ Open Source Developer Kit (CLI + Recipes) cho lập trình viên xây dựng và chia sẻ quy trình agent.
3.  **Lớp Động Cơ (Hub)**: Hạ tầng backend tập trung (OpenClaw, BullMQ, PostgreSQL) điều phối việc thực thi nhiệm vụ thông qua **Tôm Hùm Daemon**.

## 2. Yêu Cầu Phát Triển Sản Phẩm (PDR)

### 2.1 Yêu Cầu Chức Năng (Functional Requirements)

#### A. Xác Thực & Quản Lý Người Dùng
- **FR-AUTH-01**: Hệ thống hỗ trợ xác thực API Key cho CLI.
- **FR-AUTH-02**: Nền tảng Web hỗ trợ đăng ký/đăng nhập qua Supabase Auth.
- **FR-AUTH-03**: Người dùng có số dư tín dụng (AgencyCoin) để chi trả cho các tác vụ.

#### B. Thực Thi Công Việc (Engine & Tôm Hùm)
- **FR-JOB-01**: Hệ thống tiếp nhận yêu cầu qua REST API hoặc File IPC (`tasks/`).
- **FR-JOB-02**: Tôm Hùm (OpenClaw) tự động phát hiện và điều phối nhiệm vụ tới CC CLI.
- **FR-JOB-03**: Mọi cuộc gọi LLM phải đi qua **Antigravity Proxy** (Port 9191) để quản lý quota.
- **FR-JOB-04**: Hệ thống hỗ trợ cơ chế "Auto-CTO" để tự động sinh ra các task bảo trì chất lượng code.

#### C. CLI & Công Thức (Recipes)
- **FR-CLI-01**: CLI (Mekong Cook) cho phép người dùng lập kế hoạch (Plan), thực thi (Execute) và kiểm tra (Verify).
- **FR-CLI-02**: Công thức (Recipes) được định nghĩa bằng Markdown/JSON chuẩn hóa.
- **FR-CLI-03**: Tích hợp chặt chẽ với Binh Pháp Quality Gates (kiểm tra type safety, security, performance).

### 2.2 Yêu Cầu Phi Chức Năng (Non-Functional Requirements)

#### A. Hiệu Năng
- **NFR-PERF-01**: Thời gian phản hồi API cho việc gửi job < 200ms.
- **NFR-PERF-02**: Build time cho các dự án con phải < 10s (Binh Pháp Gate).

#### B. Độ Tin Cậy & Khả Năng Phục Hồi
- **NFR-REL-01**: Hệ thống tự động retry khi gặp lỗi mạng hoặc lỗi LLM tạm thời.
- **NFR-REL-02**: Tôm Hùm Daemon giám sát brain process với healthcheck & model failover, không respawn tự động.
- **NFR-REL-03**: Dữ liệu quan trọng (credits, trạng thái job) được lưu trữ bền vững trong PostgreSQL.

#### C. Khả Năng Mở Rộng
- **NFR-SCALE-01**: Kiến trúc hỗ trợ mở rộng ngang các Worker node.
- **NFR-SCALE-02**: Hỗ trợ thực thi song song (Agent Teams) trên nhiều worktree.

#### D. Bảo Mật
- **NFR-SEC-01**: API Keys phải được luân chuyển và bảo vệ.
- **NFR-SEC-02**: Tuân thủ quy tắc "Không commit secrets" (được kiểm tra bởi Binh Pháp).
- **NFR-SEC-03**: Input đầu vào được validate chặt chẽ (Zod/Pydantic) để chống injection.

## 3. Tóm Tắt Kiến Trúc
- **Frontend**: Next.js 14, Tailwind CSS.
- **Backend API**: Node.js, Fastify.
- **Worker (Tôm Hùm)**: Node.js, OpenClaw Autonomous Daemon.
- **CLI Engine**: Python 3.11, Typer.
- **Database**: PostgreSQL (Prod), SQLite (Dev).
- **Proxy**: Antigravity Proxy (Load balancing LLM).

## 4. Chỉ Số Thành Công
- **Ổn định**: Không có "Ghost Jobs" (job bị mất trạng thái).
- **Sẵn sàng**: 99.9% uptime cho Engine API.
- **Chất lượng**: 100% code được merge phải vượt qua Binh Pháp Quality Gates.
