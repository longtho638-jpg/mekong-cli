# Arbitrage Strategies - Algo Trader

Tài liệu này chi tiết về 3 chiến thuật Arbitrage đã được triển khai trong hệ thống.

## 1. Cross-Exchange Arbitrage
**File:** `src/strategies/CrossExchangeArbitrage.ts`

### Nguyên lý
Khai thác sự chênh lệch giá của cùng một loại tài sản (ví dụ: BTC/USDT) giữa hai sàn giao dịch khác nhau.

### Thuật toán
- **Input**: Giá từ sàn hiện tại (`candle.close`) và giá từ sàn đối chiếu (`candle.metadata.exchangeBPrice`).
- **Spread Calculation**: `spread = |PriceA - PriceB| / min(PriceA, PriceB)`.
- **Threshold**: Mặc định là `0.1%` (`0.001`).
- **Execution**:
    - Nếu `PriceA < PriceB`: Mua ở sàn A, Bán ở sàn B.
    - Nếu `PriceA > PriceB`: Bán ở sàn A, Mua ở sàn B.

---

## 2. Triangular Arbitrage
**File:** `src/strategies/TriangularArbitrage.ts`

### Nguyên lý
Khai thác sự mất cân bằng giá giữa 3 cặp tiền tệ trên cùng một sàn giao dịch để tạo ra lợi nhuận phi rủi ro.

### Thuật toán
- **Cấu trúc tam giác**: Ví dụ BTC/USDT -> ETH/BTC -> ETH/USDT.
- **Forward Path**: USDT → BTC → ETH → USDT.
    - `rate = (1 / Price_BTC_USDT / Price_ETH_BTC) * Price_ETH_USDT`.
- **Backward Path**: USDT → ETH → BTC → USDT.
    - `rate = (1 / Price_ETH_USDT) * Price_ETH_BTC * Price_BTC_USDT`.
- **Profit Threshold**: Mặc định `0.05%` (`0.0005`).

---

## 3. Statistical Arbitrage (Pairs Trading)
**File:** `src/strategies/StatisticalArbitrage.ts`

### Nguyên lý
Dựa trên giả thuyết rằng hai tài sản có độ tương quan cao sẽ có xu hướng hồi quy về giá trị trung bình nếu khoảng cách (spread) giữa chúng giãn rộng bất thường.

### Thuật toán
- **Metrics**: Sử dụng Z-Score của tỷ giá (Ratio) giữa hai tài sản A và B.
- **Lookback Period**: 100 nến.
- **Correlation Check**: Chỉ giao dịch nếu độ tương quan (Correlation) > 0.8.
- **Signals**:
    - **Entry**:
        - `Z-Score > 2.0`: Bán A, Mua B.
        - `Z-Score < -2.0`: Mua A, Bán B.
    - **Exit**: Khi Z-Score hồi quy về vùng `< 0.5`.

---

## Implementation Notes
- Các chiến thuật Arbitrage yêu cầu dữ liệu đa nguồn (multi-source) hoặc đa cặp (multi-pair) đồng bộ. Hiện tại hệ thống giả định các dữ liệu bổ trợ được cung cấp qua trường `metadata` của `ICandle`.
- Trong tương lai, `IDataProvider` cần được nâng cấp để hỗ trợ luồng dữ liệu phức tạp hơn.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
