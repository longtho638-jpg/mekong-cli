# Codebase Summary - Algo Trader

## Overview
Algo Trader là một modular trading bot được thiết kế để thực thi các chiến thuật giao dịch tự động. Hệ thống hỗ trợ nhiều loại chiến thuật từ các chỉ báo kỹ thuật truyền thống (RSI, SMA) đến các chiến thuật Arbitrage phức tạp.

## Project Structure
- `src/core/`: Chứa các thành phần cốt lõi của bot (`BotEngine`, `RiskManager`, `OrderManager`).
- `src/strategies/`: Chứa các triển khai chiến thuật giao dịch.
- `src/interfaces/`: Định nghĩa các contracts cho hệ thống.
- `src/data/`: Các data providers (`MockDataProvider`).
- `src/execution/`: Xử lý tương tác với các sàn giao dịch (`ExchangeClient`).
- `src/analysis/`: Các công cụ tính toán chỉ báo kỹ thuật (`Indicators`).
- `src/reporting/`: Các công cụ báo cáo và phân tích hiệu suất.
- `src/ui/`: Giao diện dòng lệnh (CLI).

## Key Components
- **BotEngine**: Điều phối luồng dữ liệu từ `IDataProvider` qua `IStrategy` đến `IExchange`.
- **RiskManager**: Quản lý rủi ro và tính toán khối lượng lệnh.
- **OrderManager**: Theo dõi và quản lý trạng thái các lệnh.
- **StrategyLoader**: Tải các chiến thuật từ file cấu hình.

## Recent Additions: Arbitrage Strategies
Hệ thống đã bổ sung 3 chiến thuật Arbitrage mới:
1. **Cross-Exchange Arbitrage**: Khai thác chênh lệch giá của cùng một tài sản trên hai sàn khác nhau.
2. **Triangular Arbitrage**: Khai thác chênh lệch giá giữa 3 cặp tiền trên cùng một sàn (ví dụ: BTC -> ETH -> USDT -> BTC).
3. **Statistical Arbitrage (Pairs Trading)**: Giao dịch cặp tiền dựa trên sự tương quan và hồi quy về giá trị trung bình (Mean Reversion), sử dụng Z-Score.

## Tech Stack
- TypeScript
- Node.js
- CCXT (Exchange connectivity)
- TechnicalIndicators (Math/Finance indicators)
- Jest (Testing framework)

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
