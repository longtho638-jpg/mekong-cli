# Cal.com → Algo-Trading Architecture Patterns

**Date:** 2026-03-01 | **Duration:** Research
**Source:** Cal.com Docs v2.1+, GitHub Architecture, DeepWiki API Reference

---

## 1. BOOKING LIFECYCLE → TRADE LIFECYCLE STATE MACHINE

**Cal.com Pattern:**
```
PENDING → ACCEPTED → COMPLETED
              ↓
          REJECTED / CANCELLED (terminal)
```

**Map to Trading:**
```
SIGNAL        → PENDING_CONFIRM → FILLED → COMPLETED
(trigger)        (human/auto)     (execute)  (settle)
                     ↓
                REJECTED / CANCELLED
```

- **State enum** governs allowed transitions (enforced type-safety)
- **Notifications** fire on state change (email → exchange webhook)
- **Instant vs. pending** depends on config (auto-confirm strategy vs. manual approval)

---

## 2. AVAILABILITY ENGINE → TRADE SLOT CALCULATOR

**Cal.com Pattern:**
```
AvailableSlotsService:
  query calendar → apply buffers/conflicts → return [[times]]
```

**Map to Trading:**
```
TradeSlotCalculator:
  query portfolio state → apply max-position, DCA schedule → return [executableTimes]
```

- **Buffer time** ↔ **min holding period** between trades
- **Booking limits** (X per day) ↔ **max trades per interval**
- **Live calendar sync** ↔ **live portfolio state sync**

---

## 3. WEBHOOK SECURITY & PAYLOAD VERSIONING

**Cal.com Pattern:**
```
Subscriber URL + Secret Key → HMAC-SHA256(body, secret)
Header: x-cal-signature-256, x-cal-webhook-version
```

**Map to Trading:**
```
Exchange Webhook Endpoint + API Secret → HMAC verification
Monitor fills, cancels, margin events, funding
```

- Payload versioning allows backward compatibility
- Custom templates inject dynamic data (`{{organizer.name}}` → `{{exchange.balance}}`)
- 19+ event types ↔ 15+ exchange event types (fills, errors, rebalance signals)

---

## 4. APP STORE ARCHITECTURE → STRATEGY MARKETPLACE

**Cal.com Apps Structure:**
```
packages/app-store/
  ├── _baseApp/          (template)
  ├── {appName}/
  │   ├── config.json    (metadata, auto-generated)
  │   ├── api/
  │   │   └── add.ts     (third-party OAuth/connection)
  │   └── components/    (UI)
```

**Map to Trading - Strategy Marketplace:**
```
strategies/
  ├── _baseStrategy/     (template with hooks)
  ├── dca-accumulator/
  │   ├── config.yaml    (params, thresholds, exchanges)
  │   ├── api/
  │   │   └── connect.ts (exchange auth)
  │   └── verifier/      (backtest + live validation)
```

- **Config-driven activation** (no code changes)
- **Pluggable dependency injection** for exchange clients
- **Versioning** via config.version for strategy updates

---

## 5. MULTI-TENANT ISOLATION & TEAM CONFIGURATION

**Cal.com Pattern:**
```
User → Teams (collaborative) → Organizations (subdomain isolation)
Access control: owner/admin/member roles
Private teams: info on need-to-know basis
```

**Map to Trading:**
```
User → Trading Accounts (collaborative) → Workspace (API-key isolation)
Access control: admin/trader/auditor roles
Private accounts: balance/keys only to assigned users
```

- **Per-event-type webhooks** ↔ **per-strategy webhooks**
- **Team-level settings override** personal settings ↔ **workspace-level risk limits**

---

## 6. TWO-LAYER API ARCHITECTURE

**Cal.com Pattern:**
```
tRPC (internal web app, type-safe) → REST API v2 (external platform, versioned)
Both backed by single data model (BookingStatus enum, EventType schema)
```

**Map to Trading:**
```
Internal gRPC (type-safe PEV coordination) → REST API v2 (external algo access)
Both backed by TradeLifecycle, StrategyState enums
```

---

## 7. BOOKING CREATION FLOW → TRADE ORDER CREATION

**Cal.com:** `handleNewBooking` → validate → create record → notify
**Trading:** `TradeOrderService` → validate portfolio state → create order → execute

- **RegularBookingService** handles standard case ↔ **DCAOrderService**
- **Conflict checking** logic ↔ **position sizing** logic
- **Multi-channel notify** (email/webhook/SMS) ↔ **multi-sink notify** (Slack/Discord/webhook)

---

## KEY TAKEAWAYS

| Cal.com | Trading System |
|---------|---|
| State machine (BookingStatus enum) | State machine (TradeLifecycle enum) |
| tRPC + REST API layering | gRPC + REST API layering |
| HMAC-signed webhooks | HMAC-signed exchange webhooks |
| App store with config.json | Strategy store with config.yaml |
| Availability slots calculation | Trade slot calculation (portfolio limits) |
| Multi-tenant via teams + orgs | Multi-strategy via accounts + workspaces |
| Event type customization | Strategy customization (entry/exit rules) |

**Unresolved Questions:**
- Exact database schema for state transitions (DAG vs. simple enum)?
- Retry/idempotency strategy for webhook delivery on exchange failures?
- Auto-healing logic when a strategy encounters runtime errors?
