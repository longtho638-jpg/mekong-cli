"""
📄 Proposal Generator Templates
==============================

Markdown templates for generating strategic proposals.
"""

PROPOSAL_TEMPLATE = """# 📜 Strategic Proposal: {client_name}

> **Engagement Tier:** {tier_label}
> **Prepared by {agency_name}** | {date}
> Proposal ID: #{proposal_id:04d} | Valid until: {valid_until}

---

## 🎯 Executive Summary

Chào **{client_contact}**,

Cảm ơn Anh đã tin tưởng và kết nối cùng **{agency_name}**. Dựa trên mục tiêu tăng trưởng của Anh, chúng tôi đề xuất lộ trình hợp tác theo phương pháp **Binh Pháp WIN-WIN-WIN** - đảm bảo sự bền vững và đột phá cho cả hai bên.

---

## 📦 Giải Pháp Chiến Lược (Strategic Modules)

Chúng tôi đã lựa chọn các module Binh Pháp tối ưu nhất cho giai đoạn này:

| Module | Dịch Vụ | Chi Tiết | Đầu Tư |
|--------|---------|----------|--------|
{service_table}

---

## 💰 Cơ Cấu Hợp Tác (Engagement Model)

### 1. Đầu Tư Ban Đầu (One-Time)
| Hạng mục | Giá trị |
|----------|---------|
| Tổng các Module thực thi | ${project_total:,.0f} |

### 2. Đồng Hành Hàng Tháng (Retainer)
| Hạng mục | Giá trị |
|----------|---------|
| Phí quản lý & vận hành | ${monthly_retainer:,.0f}/tháng |
| Thời hạn tối thiểu | 06 tháng |

### 3. Chia Sẻ Thành Quả (Equity & Success)
| Hạng mục | Tỷ lệ |
|----------|-------|
| Cổ phần chiến lược (Equity) | {equity_percent:.1f}% |
| Phí thành công (Success Fee) | {success_fee:.1f}% của vòng gọi vốn tiếp theo |

**Ước tính giá trị năm đầu tiên: ${total_year1:,.0f}**

---

## 🏯 WIN-WIN-WIN Alignment Check

Mọi sự hợp tác tại Agency OS đều phải vượt qua bài kiểm tra "Tam Thắng":

### 👑 WIN Của Anh (Client)
{client_win}

### 🏢 WIN Của Agency
{agency_win}

### 🎯 OWNER WIN (Sự Gắn Kết)
{owner_win}

**Điểm Cân Bằng (Alignment Score): {alignment_score}/100** {alignment_emoji}

{warnings_section}

---

## 📋 Điều Khoản & Lộ Trình

### Thanh Toán
- 50% Ngay sau khi ký hợp đồng.
- 50% Sau khi hoàn thành các module chiến lược.
- Retainer hàng tháng thanh toán vào ngày 05 mỗi tháng.

### Lộ Trình Thực Thi
- **Tuần 1:** Khám phá (Discovery) & Thiết lập DNA.
- **Tuần 2-3:** Xây dựng Moat & Huấn luyện AI Agents.
- **Tuần 4+:** Triển khai đa kênh & Tăng trưởng.

---

## ✍️ Bước Tiếp Theo

1. **Phản hồi:** Anh vui lòng xem qua và cho ý kiến về các module đề xuất.
2. **Hợp đồng:** Chúng tôi sẽ gửi bản thảo hợp đồng điện tử sau khi thống nhất.
3. **Kích hoạt:** Bắt đầu hành trình chinh phục cột mốc mới.

---

> 🏯 **"Bất chiến nhi khuất nhân chi binh"**
> *Thắng mà không cần đánh - Chúng tôi chỉ thắng khi Anh thắng.*

**{agency_name}**
Zalo/Phone: {agency_phone}
Email: {agency_email}
"""
