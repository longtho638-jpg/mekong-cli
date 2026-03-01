## Phase 4: Real-time WebSocket Streaming

### Context Links
- Parent: [plan.md](plan.md)
- Depends on: [Phase 1](phase-01-trading-frame-data-abstraction.md), [Phase 3](phase-03-trading-alert-engine.md)
- Inspiration: Grafana Live — single multiplexed WebSocket, PUB/SUB channels, push model

### Overview
- **Date:** 2026-03-01
- **Priority:** P2
- **Description:** WebSocket server streaming real-time trading data: P&L, spread detections, alert events, regime changes. Inspired by Grafana Live's channel-based multiplexing.
- **Implementation status:** pending
- **Review status:** pending
- **Effort:** 2h

### Key Insights (from Grafana)
- Grafana Live: ONE WebSocket per client, multiplexed channels
- Channel format: `<scope>/<namespace>/<path>` → Trading: `trading/btc-usdt/spreads`
- Push model: backend pushes data to subscribed clients (no polling)
- 100 concurrent connections cap (sufficient for monitoring dashboards)
- Sub-1s latency via InfluxDB line protocol push

### Requirements
- WebSocket server on configurable port (default 8765)
- Channel-based subscriptions: clients subscribe to specific data streams
- Channels: `spreads/<symbol>`, `pnl/summary`, `alerts/<severity>`, `regime/current`
- Publish from AGI engine event hooks → WebSocket broadcast
- JSON message format with timestamp, channel, payload

### Architecture
```
TradingStreamServer {
  start(port: number): void
  stop(): void
  publish(channel: string, data: unknown): void
  getSubscriberCount(): number
}

Channels:
  spreads/BTC-USDT    → { buyEx, sellEx, spread%, netProfit }
  spreads/ETH-USDT    → same
  pnl/summary         → { cumPnl, drawdown%, equity, trades }
  alerts/all           → { ruleId, state, severity, message }
  regime/current       → { regime, confidence, hurst, volRatio }
```

### Related Code Files
- `packages/vibe-arbitrage-engine/websocket-price-feed.ts` — existing WS feed (inbound)
- `packages/vibe-arbitrage-engine/spread-detector-engine.ts` — event hooks
- `packages/vibe-arbitrage-engine/profit-tracker.ts` — P&L data source
- **New:** `src/core/trading-stream-server.ts`
- **New:** `src/core/trading-stream-server.test.ts`

### Implementation Steps
1. Create `TradingStreamServer` using native `ws` package (already in node_modules via ccxt)
2. Implement channel subscription: clients send `{ subscribe: "spreads/BTC-USDT" }`
3. Implement publish: broadcast to all subscribers of a channel
4. Hook into SpreadDetectorEngine/AgiEngine event callbacks → publish to channels
5. Add CLI flag `--stream` to arb:spread and arb:agi commands to enable WS server
6. Write tests: connect/subscribe/publish/disconnect lifecycle

### Todo
- [ ] TradingStreamServer with channel multiplexing
- [ ] Client subscribe/unsubscribe protocol
- [ ] Publish integration with AGI engine events
- [ ] CLI `--stream` flag on arb commands
- [ ] Unit tests (≥6 tests)

### Success Criteria
- WS clients receive spread/P&L/alert data within 100ms of detection
- Multiple clients can subscribe to different channels independently
- Server handles connect/disconnect gracefully (no crashes on client drop)
- Zero impact on trading performance when no clients connected

### Risk Assessment
- **Low:** WebSocket server is additive, opt-in via --stream flag
- **Medium:** Resource usage with many connected clients
- **Mitigation:** Cap at 50 connections, broadcast throttle at 100ms interval

### Security Considerations
- WS server binds to localhost only by default (no external exposure)
- No authentication for v1 (local monitoring only)
- Future: add token-based auth for remote monitoring

### Next Steps
- Phase 5 transform pipeline feeds processed data to WS channels
