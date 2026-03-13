# Algo-Trader REST API Reference

> **ROIaaS API** — Real-time trading signals, backtesting, subscription management.
> **Version:** 1.0.0 | **Base URL:** `http://localhost:3000/api`

---

## Authentication

All API endpoints require authentication via headers:

| Header | Required | Description |
|--------|----------|-------------|
| `X-API-Key` | Yes | Your API key |
| `X-User-ID` | Yes | User identifier for usage tracking |
| `X-License-Tier` | No | License tier (FREE/PRO/ENTERPRISE) |

---

## Endpoints

### Backtest APIs (Phase 6)

#### GET /api/backtest/limits

Get tier-based lookback limits.

**Response:**
```json
{
  "success": true,
  "tiers": {
    "free": { "lookbackDays": 7, "metrics": ["totalReturn", "winRate", "profitFactor", "maxDrawdown"] },
    "pro": { "lookbackDays": 90, "metrics": ["totalReturn", "winRate", "profitFactor", "maxDrawdown", "sharpeRatio", "sortinoRatio", "calmarRatio"] },
    "enterprise": { "lookbackDays": 365, "metrics": ["all"] }
  },
  "currentTier": "free"
}
```

#### POST /api/backtest/simulate

Run strategy simulation on historical data.

**Request:**
```json
{
  "strategyId": "rsi-sma-crossover",
  "symbol": "BTC/USDT",
  "lookbackDays": 30,
  "initialCapital": 10000,
  "data": [{ "timestamp": 1710000000000, "yesPrice": 52, "noPrice": 48, "volume": 10000, "openInterest": 50000 }]
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "totalReturn": 15.5,
    "totalTrades": 42,
    "winRate": 64.3,
    "profitFactor": 2.1,
    "maxDrawdown": 8.5,
    "sharpeRatio": 1.8,
    "sortinoRatio": 2.3,
    "lookbackDays": 30,
    "tier": "PRO"
  }
}
```

#### POST /api/backtest/accuracy

Test historical signal accuracy.

**Request:**
```json
{
  "signals": [
    { "timestamp": 1710000000000, "predicted": true, "actual": true }
  ],
  "lookbackDays": 30
}
```

**Response:**
```json
{
  "success": true,
  "metrics": {
    "totalSignals": 100,
    "correctSignals": 65,
    "accuracyRate": 0.65,
    "falsePositives": 20,
    "falseNegatives": 15,
    "precision": 0.72,
    "recall": 0.68,
    "f1Score": 0.70
  }
}
```

#### POST /api/backtest/project

Project PnL based on historical performance (PRO+).

**Request:**
```json
{
  "historicalTrades": [
    { "marketId": "BTC-USD", "profit": 150, "timestamp": 1710000000000 }
  ],
  "projectionDays": 30,
  "initialCapital": 10000
}
```

**Response:**
```json
{
  "success": true,
  "projection": {
    "expectedReturn": 12.5,
    "confidenceInterval": { "lower": -5.2, "upper": 28.3, "confidence": 90 },
    "riskMetrics": {
      "volatility": 15.2,
      "maxDrawdown": 8.5,
      "sharpeRatio": 1.8,
      "var95": 520
    },
    "projectionDays": 30,
    "initialCapital": 10000,
    "projectedFinalCapital": 11250
  }
}
```

---

### Notifications APIs (Phase 7)

#### GET /api/notifications/preferences

Get user notification preferences.

**Response:**
```json
{
  "success": true,
  "preferences": {
    "userId": "user_123",
    "emailEnabled": true,
    "telegramEnabled": true,
    "webhookEnabled": false,
    "realtimeEnabled": true,
    "digestEnabled": false,
    "alertTypes": {
      "signal_generated": true,
      "daily_pnl_summary": true,
      "portfolio_risk_warning": true
    }
  },
  "tier": "PRO"
}
```

#### PUT /api/notifications/preferences

Update user notification preferences.

**Request:**
```json
{
  "emailEnabled": true,
  "telegramEnabled": true,
  "webhookEnabled": true,
  "webhookUrl": "https://myapp.com/webhook",
  "realtimeEnabled": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Preferences updated",
  "preferences": { ... }
}
```

#### POST /api/notifications/test

Send test notification.

**Request:**
```json
{
  "type": "test",
  "channel": "email",
  "message": "Test notification"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test notification sent",
  "results": [{ "channel": "email", "success": true, "messageId": "email_123" }]
}
```

#### GET /api/notifications/channels

Get available notification channels for current tier.

**Response:**
```json
{
  "success": true,
  "tier": "PRO",
  "channels": {
    "available": ["email", "telegram", "webhook", "push"],
    "features": { "digest": true, "realtime": true, "webhook": true, "sms": false }
  }
}
```

---

### Usage & Metering APIs

#### GET /api/usage

Get current usage status.

**Response:**
```json
{
  "success": true,
  "status": {
    "userId": "user_123",
    "tier": "PRO",
    "trades": { "used": 45, "limit": "Unlimited", "remaining": Infinity, "percentUsed": 0 },
    "signals": { "used": 120, "limit": "Unlimited", "remaining": Infinity, "percentUsed": 0 },
    "apiCalls": { "used": 523, "limit": 10000, "remaining": 9477, "percentUsed": 5.23 }
  }
}
```

#### GET /api/usage/limits

Get tier limits configuration.

**Response:**
```json
{
  "success": true,
  "limits": {
    "free": { "tradesPerDay": 5, "signalsPerDay": 3, "apiCallsPerDay": 100 },
    "pro": { "tradesPerDay": -1, "signalsPerDay": -1, "apiCallsPerDay": 10000 },
    "enterprise": { "tradesPerDay": -1, "signalsPerDay": -1, "apiCallsPerDay": 100000 }
  }
}
```

---

### Subscription & Billing APIs

#### GET /api/subscription/status

Get subscription status.

#### POST /api/billing/webhook

Polar webhook handler for subscription events.

---

## Error Responses

| Code | Error | Description |
|------|-------|-------------|
| 400 | Bad Request | Invalid request |
| 401 | Unauthorized | Invalid API key |
| 403 | Forbidden | Tier restriction |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Error | Server error |

**Example:**
```json
{
  "success": false,
  "error": "lookback_limit_exceeded",
  "message": "Lookback period exceeds tier limit",
  "upgradePrompt": {
    "title": "Upgrade to PRO",
    "description": "PRO tier includes 90-day lookback",
    "upgradeUrl": "/pricing"
  }
}
```

---

## Rate Limits

| Tier | API Calls/Day | Signals/Day | Trades/Day |
|------|---------------|-------------|------------|
| FREE | 100 | 3 | 5 |
| PRO | 10,000 | Unlimited | Unlimited |
| ENTERPRISE | 100,000 | Unlimited | Unlimited |

---

## OpenAPI Spec

Interactive docs: `/api-docs`
YAML spec: `/src/swagger.yaml`
