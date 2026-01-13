---
title: Cài đặt
description: Hướng dẫn cài đặt AgencyOS - Hệ điều hành AI cho Agency
section: getting-started
category: getting-started
order: 2
published: true
---

# Cài đặt

Hướng dẫn này sẽ giúp bạn cài đặt AgencyOS và thiết lập môi trường tự động hóa agency.

## Video Hướng Dẫn

Thích xem video? Xem hướng dẫn cài đặt đầy đủ:

<div style="text-align: center; padding: 3rem; background: var(--color-bg-tertiary); border-radius: 0.75rem; border: 1px solid var(--color-border); margin-bottom: 1rem;"><div style="font-size: 3rem; margin-bottom: 1rem;">🏯</div><h3 style="margin: 0 0 0.5rem 0;">Video Demo Sắp Ra Mắt</h3><p style="margin: 0; color: var(--color-text-muted);">Xem tài liệu để bắt đầu</p></div>

## Yêu Cầu

Trước khi cài đặt AgencyOS, đảm bảo bạn có:

- **Python** 3.8 trở lên
- **Git** để clone repository
- **pip** để cài đặt dependencies
- **License Key AgencyOS** (lấy từ [agencyos.network/pricing](/pricing))

## Cài Đặt Nhanh

### Bước 1: Clone Repository

```bash
# Clone AgencyOS Starter
git clone https://github.com/longtho638-jpg/agencyos-starter.git

# Vào thư mục
cd agencyos-starter
```

### Bước 2: Cài Đặt Dependencies

```bash
# Cài đặt Python dependencies
pip install -r requirements.txt
```

### Bước 3: Kích Hoạt License

```bash
# Kích hoạt với license key
python activate.py YOUR-LICENSE-KEY
```

Thay `YOUR-LICENSE-KEY` bằng key bạn nhận được sau khi mua.

### Bước 4: Xác Minh Cài Đặt

```bash
# Hiển thị các commands có sẵn
python -m core.help

# Kiểm tra modules đã cài
ls core/
```

## Chạy Commands

Các commands AgencyOS là Python modules. Chạy như sau:

```bash
# Marketing commands
python -m core.marketing_hub

# Sales commands
python -m core.sales_hub

# Finance commands
python -m core.finance_hub

# Chiến lược (Binh Pháp)
python -m core.strategy_officer
```

## Tích Hợp IDE (Khuyến Nghị)

Để có trải nghiệm tốt nhất, mở trong IDE có AI:

### Cursor IDE
[![Open in Cursor](https://img.shields.io/badge/Open%20in-Cursor-blue?style=for-the-badge&logo=cursor)](https://cursor.com)

1. Mở Cursor IDE
2. Clone: `git clone https://github.com/longtho638-jpg/agencyos-starter.git`
3. Mở thư mục trong Cursor
4. Sử dụng terminal tích hợp để chạy commands

### VS Code
1. Mở VS Code
2. Clone và mở thư mục agencyos-starter
3. Cài đặt Python extension
4. Sử dụng terminal tích hợp

## Xử Lý Lỗi

### Không tìm thấy Python
```bash
# Kiểm tra phiên bản Python
python --version

# Nếu không tìm thấy, cài đặt Python 3.8+
# macOS: brew install python
# Ubuntu: sudo apt install python3
# Windows: Tải từ python.org
```

### Lỗi quyền truy cập
```bash
# Sử dụng pip với cờ user
pip install --user -r requirements.txt
```

### Kích hoạt license thất bại
- Kiểm tra license key đúng
- Đảm bảo kết nối internet
- Liên hệ support@agencyos.network

## Bước Tiếp Theo

Sau khi cài đặt:

1. 📖 Đọc [Hướng Dẫn Nhanh](/vi/docs/getting-started/quick-start)
2. 📋 Khám phá [85+ Commands](/commands)
3. 🖥️ Thử [Demo Tương Tác](/demo)
4. 💰 Tính [ROI của bạn](/roi-calculator)

---

**Cần hỗ trợ?** Liên hệ chúng tôi tại [hello@agencyos.network](mailto:hello@agencyos.network)
