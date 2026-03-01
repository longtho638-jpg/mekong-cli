# DEEP CẢI TỔ DOANH TRẠI

NHIỆM VỤ: Dọn dẹp TOÀN BỘ monorepo mekong-cli cho trật tự kỷ cương.
Trả lời hoàn toàn bằng TIẾNG VIỆT.

1. SCAN toàn bộ `~/mekong-cli/apps/` — liệt kê TẤT CẢ dự án, size, trạng thái (active/archive/dead).
2. Xoá các file rác .bak, folder rỗng, broken symlinks.
3. Di chuyển các file lẻ (activate-lobster-team.js...) vào đúng chỗ hoặc xoá nếu là rác.
4. Tìm các dự án ngoài mekong-cli (`~/archive-2026/`, `~/Well`...) kéo vào apps/well nếu cần thiết (hoặc báo cáo tình trạng symlink).
5. Tạo `README.md` và `.gitignore` cơ bản cho các apps/ đang thiếu.
6. Cập nhật file `README.md` ở gốc mekong-cli liệt kê cấu trúc mới rõ ràng.

QUAN TRỌNG: Chỉ sửa structure, KHÔNG sửa logic code. Commit kết quả khi hoàn thành.
