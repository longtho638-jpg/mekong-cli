# 📖 Hướng Dẫn Sử Dụng — mekong-cli

## 1. Đăng Nhập Admin Dashboard

1. Truy cập `[URL]/admin`
2. Nhập email và mật khẩu được cung cấp
3. Trang Dashboard hiển thị tổng quan hệ thống

## 2. Cập Nhật Nội Dung

| Vị trí | Loại nội dung |
|--------|---------------|
| `src/data/` | Sản phẩm, giá, hình ảnh |
| `src/app/` | Nội dung trang, layout |
| `public/` | Logo, favicon, assets |

## 3. Quản Lý Đơn Hàng / Khách Hàng

- Admin Dashboard → Orders
- Lọc theo trạng thái: Pending / Processing / Completed
- Export CSV cho báo cáo

## 4. Thay Đổi Giao Diện

- **Logo**: Thay file `public/logo.png`
- **Màu sắc**: Sửa `tailwind.config.ts` hoặc CSS variables
- **Font**: Sửa trong `src/app/layout.tsx`

## 5. Triển Khai Lại (Re-deploy)

```bash
git add -A && git commit -m "update content"
git push origin main
# Vercel/Cloudflare sẽ tự deploy
```

## 6. Liên Hệ Hỗ Trợ

- **Email**: support@agencyos.network
- **Hotline**: [Số điện thoại]
- **Response time**: Theo gói bảo trì đã chọn

## 7. FAQ

**Q: Trang web bị lỗi trắng?**
A: Kiểm tra Console (F12) → liên hệ support kèm screenshot.

**Q: Muốn thêm tính năng mới?**
A: Gửi yêu cầu qua email/Slack → nhận báo giá trong 24h.

---
_AgencyOS User Guide Standard v1.0_
