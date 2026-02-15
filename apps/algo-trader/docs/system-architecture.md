# System Architecture - Algo Trader

## High-Level Architecture
Hệ thống tuân theo mô hình **Event-Driven** và **Modular Architecture**.

```mermaid
graph TD
    DP[IDataProvider] -->|Candles| BE[BotEngine]
    BE -->|Analyze| ST[IStrategy]
    ST -->|Signal| BE
    BE -->|Risk Check| RM[RiskManager]
    RM -->|Position Size| BE
    BE -->|Execute| EC[ExchangeClient]
    EC -->|Order Result| OM[OrderManager]
    OM -->|Status| BE
    BE -->|Metrics| PA[PerformanceAnalyzer]
    PA -->|Report| RP[ConsoleReporter/HtmlReporter]
```

## Core Components

### 1. BotEngine (`src/core/BotEngine.ts`)
Trung tâm điều phối của hệ thống. Nhận dữ liệu từ `IDataProvider`, gửi đến `IStrategy` để lấy tín hiệu, sau đó phối hợp với `RiskManager` và `OrderManager` để thực thi lệnh.

### 2. Strategy Layer (`src/strategies/`)
Chứa các lớp triển khai logic giao dịch tuân thủ interface `IStrategy`.
- **Technical Indicators**: RSI Crossover, SMA.
- **Arbitrage**: Cross-Exchange, Triangular, Statistical.

### 3. Data Layer (`src/data/`)
Định nghĩa cách thức lấy dữ liệu qua interface `IDataProvider`.
- `MockDataProvider`: Dùng cho testing và backtest.
- `ExchangeDataProvider` (TBD): Dự kiến triển khai để lấy dữ liệu live qua CCXT.

### 4. Execution Layer (`src/execution/`)
- `ExchangeClient`: Tương tác trực tiếp với API của các sàn giao dịch thông qua thư viện CCXT.

### 5. Risk & Order Management (`src/core/`)
- `RiskManager`: Tính toán số lượng cần mua/bán để đảm bảo không vi phạm quy tắc quản lý vốn.
- `OrderManager`: Lưu trữ và cập nhật trạng thái các lệnh đang mở.

## Data Flow
1. `IDataProvider` phát ra sự kiện `onCandle`.
2. `BotEngine` nhận candle và chuyển cho `IStrategy`.
3. `IStrategy` tính toán (indicators, arbitrage spreads) và trả về `ISignal` (BUY/SELL) hoặc `null`.
4. Nếu có tín hiệu, `BotEngine` gọi `RiskManager` để xác định volume.
5. `BotEngine` gọi `ExchangeClient` để đặt lệnh.
6. Kết quả lệnh được lưu vào `OrderManager`.

## Technology Stack
- **TypeScript**: Đảm bảo an toàn kiểu dữ liệu.
- **CCXT**: Kết nối với hơn 100 sàn giao dịch crypto.
- **TechnicalIndicators**: Thư viện toán học cho phân tích kỹ thuật.
- **Winston**: Ghi log hệ thống.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
