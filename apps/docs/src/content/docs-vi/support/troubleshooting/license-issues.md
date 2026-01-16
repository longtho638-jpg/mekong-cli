---
title: Lỗi License & Quota
description: "Hướng dẫn xử lý lỗi License, Quota và Agent terminated"
section: support
category: support/troubleshooting
order: 6
published: true
---

# Lỗi License & Quota

Hướng dẫn xử lý các vấn đề liên quan đến bản quyền (License), giới hạn sử dụng (Quota) và lỗi Agent bị ngắt đột ngột.

## Vấn đề thường gặp

### 1. Agent Terminated Due to Error

**Triệu chứng**:

- Đang chạy Antigravity IDE thì bị ngắt.
- Thông báo lỗi: `Agent terminated due to error`.
- Thường xảy ra sau khi chạy agent một thời gian ngắn.

**Nguyên nhân**:

- Tài khoản đang sử dụng **Free Tier** (giới hạn 100 API calls/tháng hoặc 15 calls/phút).
- License gói **UItra (PRO)** chưa được kích hoạt đúng cho email đang đăng nhập.

**Cách khắc phục**:

Sử dụng script `activate_uitra.py` để kích hoạt license PRO cho email của bạn.

```bash
# 1. Chạy script kích hoạt (thay email của bạn vào)
python3 scripts/activate_uitra.py email_cua_ban@gmail.com

# Ví dụ cho billwill.mentor:
python3 scripts/activate_uitra.py billwill.mentor@gmail.com
```

**Kết quả mong đợi**:

```text
✅ License activated!
   Tier: PRO
   Limit: 10,000 API calls/month
```

**Sau khi kích hoạt**:

- **BẮT BUỘC**: Restart lại Antigravity IDE để hệ thống nhận license mới.

---

### 2. Lỗi Quota Exceeded

**Triệu chứng**:

- Thông báo `429 Resource Exhausted` hoặc `Quota exceeded`.
- Agent từ chối thực hiện lệnh.

**Kiểm tra Quota**:

Bạn có thể kiểm tra file license local để xem giới hạn hiện tại:

```bash
cat ~/.mekong/license.json
```

**So sánh các gói**:

| Gói License     | API Config | Quota/Tháng      |
| --------------- | ---------- | ---------------- |
| **Free**        | Mặc định   | 100 calls        |
| **Starter**     | Basic      | 1,000 calls      |
| **PRO (UItra)** | Advanced   | **10,000 calls** |
| **Enterprise**  | Custom     | Unlimited        |

Nếu bạn đã mua gói UItra nhưng vẫn thấy Quota thấp, hãy làm theo hướng dẫn kích hoạt ở mục 1.

---

### 3. Mất License sau khi update

**Triệu chứng**:

- Đã kích hoạt nhưng sau khi update CLI lại trở về Free tier.
- File `~/.mekong/license.json` bị mất hoặc reset.

**Cách xử lý**:

- Chạy lại lệnh kích hoạt:
    ```bash
    python3 scripts/activate_uitra.py your_email@domain.com
    ```
- Hệ thống thiết kế để **Offline-First**, license được lưu local tại `~/.mekong/` nên an toàn qua các bản update CLI thông thường, trừ khi bạn xóa thư mục home.

---

## Hỗ trợ

Nếu vẫn gặp lỗi sau khi đã kích hoạt, vui lòng liên hệ support kèm theo nội dung file license (che key nếu cần):

```bash
# Lấy thông tin debug (an toàn)
cat ~/.mekong/license.json | grep -v "key"
```
