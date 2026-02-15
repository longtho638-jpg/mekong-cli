# Project Roadmap - Algo Trader

## Phase 1: Foundation (Completed)
- [x] Thiết lập cấu trúc dự án Modular.
- [x] Triển khai `BotEngine` cơ bản.
- [x] Tích hợp CCXT và `IDataProvider`.
- [x] Triển khai chiến thuật RSI + SMA.
- [x] Hệ thống báo cáo Console & HTML.

## Phase 2: Arbitrage Expansion (Current)
- [x] Triển khai **Cross-Exchange Arbitrage**.
- [x] Triển khai **Triangular Arbitrage**.
- [x] Triển khai **Statistical Arbitrage** (Pairs Trading).
- [ ] Tích hợp WebSocket cho dữ liệu thời gian thực (Low latency).
- [ ] Cơ chế tối ưu hóa phí giao dịch (Fee calculation).

## Phase 3: Risk & Advanced Features (Planned)
- [ ] Hỗ trợ Multi-symbol trading đồng thời.
- [ ] Triển khai Trailing Stop Loss & Take Profit nâng cao.
- [ ] Dashboard UI Web (React/Next.js) để theo dõi real-time.
- [ ] Tích hợp AI/ML để tối ưu hóa tham số chiến thuật.

## Phase 4: Production Readiness
- [ ] Unit test coverage > 80%.
- [ ] Stress test với dữ liệu lịch sử lớn.
- [ ] Dockerization hệ thống.
- [ ] Deployment guide cho AWS/DigitalOcean.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
