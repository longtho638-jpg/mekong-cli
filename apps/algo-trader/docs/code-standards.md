# Code Standards - Algo Trader

## General Principles
- **YAGNI**: Chỉ cài đặt những gì thực sự cần thiết.
- **KISS**: Giữ mã nguồn đơn giản và dễ hiểu.
- **DRY**: Tránh lặp lại mã nguồn bằng cách sử dụng các utility functions hoặc abstract classes.

## TypeScript Standards
- **Strict Mode**: Luôn bật strict mode trong `tsconfig.json`.
- **No `any`**: Tuyệt đối không sử dụng kiểu `any`. Sử dụng `unknown` hoặc định nghĩa interface cụ thể.
- **Interfaces over Classes**: Ưu tiên sử dụng interface cho các cấu trúc dữ liệu. Classes chỉ dùng cho các logic có trạng thái (stateful).

## File Naming & Structure
- **Kebab-case**: Tên file phải sử dụng kebab-case (ví dụ: `cross-exchange-arbitrage.ts`).
- **Small Files**: Giữ mỗi file dưới 200 dòng code. Nếu vượt quá, hãy tách thành các module nhỏ hơn.
- **Directory Focus**: Mỗi thư mục trong `src/` phải có một mục đích duy nhất (ví dụ: `strategies/`, `interfaces/`).

## Implementation Guidelines
- **Error Handling**: Sử dụng `try-catch` cho tất cả các hoạt động bất đồng bộ (I/O, API calls).
- **Async/Await**: Sử dụng `async/await` thay vì Promise chains (`.then()`).
- **Dependency Injection**: Truyền các dependencies qua constructor để dễ dàng thực hiện unit testing.

## Git & Workflow
- **Conventional Commits**: Sử dụng format `feat:`, `fix:`, `refactor:`, `docs:`.
- **Pre-commit**: Chạy `npm run build` và `npm test` trước khi commit.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
