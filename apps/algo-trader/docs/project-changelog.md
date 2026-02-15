# Project Changelog - Algo Trader

## [0.1.0] - 2026-02-16

### Added
- Thêm chiến thuật **Cross-Exchange Arbitrage**: Khai thác chênh lệch giá giữa các sàn.
- Thêm chiến thuật **Triangular Arbitrage**: Khai thác chênh lệch giá 3 cặp tiền.
- Thêm chiến thuật **Statistical Arbitrage**: Giao dịch cặp dựa trên hồi quy Z-Score.
- Cập nhật lớp `Indicators` (`src/analysis/indicators.ts`) hỗ trợ: `standardDeviation`, `zScore`, `correlation`.
- Khởi tạo hệ thống tài liệu chuẩn hóa trong `./docs`:
    - `codebase-summary.md`
    - `project-overview-pdr.md`
    - `system-architecture.md`
    - `code-standards.md`
    - `project-roadmap.md`

### Fixed
- Cấu trúc thư mục `docs` được tổ chức lại để quản lý tốt hơn.

### Changed
- Cập nhật `package.json` với thông tin mô tả mới.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
