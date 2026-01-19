# 🏯 AgencyOS - Antigravity IDE

> **"Không đánh mà thắng" - Win Without Fighting**
> The first AI-Native IDE for Solopreneurs & Agencies.

[![AgencyOS](https://img.shields.io/badge/Agency-OS-emerald)](https://agencyos.network)
[![Architecture](https://img.shields.io/badge/Architecture-Clean-blue)](docs/architecture/top-tier-repos.md)

## 🌟 Giới Thiệu (Introduction)

AgencyOS không chỉ là một CLI tool, nó là một **Hệ Điều Hành** (Operating System) giúp bạn biến ý tưởng thành phần mềm, và phần mềm thành doanh thu.

Được xây dựng trên triết lý **Binh Pháp**, AgencyOS cung cấp:
1.  **Kiến Trúc Sư (Architect):** Tự động thiết kế structure chuẩn (Clean Arch/DDD).
2.  **Quản Lý (Kanban):** Theo dõi tiến độ task.
3.  **Doanh Thu (Revenue):** CRM, Invoice, Proposal tích hợp sẵn.

---

## 🚀 Bắt Đầu Ngay (Quick Start)

Dành cho người mới (Non-tech friendly):

### 1. Cài đặt
```bash
git clone https://github.com/your-repo/mekong-cli.git
cd mekong-cli
# Setup Kanban (Optional but recommended)
./scripts/setup_vibe_kanban.sh
```

### 2. Vibe Coding Flow (Quy Trình Chuẩn)

1.  **Khởi tạo ý tưởng:**
    ```bash
    python3 main.py scaffold "Tôi muốn làm nền tảng học trực tuyến (LMS)"
    ```

2.  **Quản lý Vận Hành (Ops):**
    ```bash
    python3 main.py ops watch      # Giám sát hệ thống
    python3 main.py ops quota      # Kiểm tra hạn mức AI
    ```

3.  **Kinh Doanh & Doanh Thu:**
    ```bash
    python3 main.py outreach add "Client Name" "email@example.com"
    python3 main.py sales proposal-create ghost_cto "email@example.com"
    python3 main.py finance invoice-create "Client Name" 5000 "Ghost CTO"
    ```

4.  **Marketing & Content:**
    ```bash
    python3 main.py content generate tweet agencyos
    ```

👉 **Xem hướng dẫn chi tiết:** `python3 main.py --help` hoặc đọc [docs/VIBE_CODING_MANUAL.md](docs/VIBE_CODING_MANUAL.md)

---

## 📂 Cấu Trúc Dự Án

```
mekong-cli/
├── antigravity/        # Core Modules
├── apps/               # Frontend (Next.js Dashboard)
├── cli/                # Command Line Interface
├── core/               # Business Logic (CRM, Finance...)
│   ├── modules/        # Modular Architecture
│   └── infrastructure/ # DB & Cache
└── docs/               # Documentation
```

## 🧠 Tài Nguyên (Resources)

*   [Kiến Trúc Chuẩn (Top Tier Repos)](docs/architecture/top-tier-repos.md)
*   [Vibe Coding Manual](docs/VIBE_CODING_MANUAL.md)

---

*Built with ❤️ by Mekong AI.*
