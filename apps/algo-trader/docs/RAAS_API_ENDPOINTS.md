# RaaS Gate API Endpoints

**Date:** 2026-03-05
**Version:** 1.0.0
**Status:** Production

---

## Overview

RAAS (Robot-as-a-Service) gate API provides tier-based access control for premium trading features. All endpoints require license authentication via headers.

## Authentication

### License Key Formats

| Tier | Format | Example |
|------|--------|---------|
| PRO | `raas-pro-*` or `RPP-*` | `raas-pro-abc123` |
| ENTERPRISE | `raas-ent-*` or `REP-*` | `raas-ent-xyz789` |

### Header Priority

1. `X-API-Key` (recommended)
2. `Authorization: Bearer <token>`
3. `RAAS_LICENSE_KEY` environment variable

### Example Request

```bash
curl -X GET "https://api.algo-trader.com/api/v1/strategies" \
  -H "X-API-Key: raas-pro-your-key" \
  -H "Content-Type: application/json"
```

---

## Tier Features

### FREE Tier (No License Required)

| Feature | Endpoint | Rate Limit |
|---------|----------|------------|
| Basic Strategies | `GET /api/v1/strategies/basic` | 10 req/min |
| Live Trading | `POST /api/v1/trade/execute` | 10 req/min |
| Basic Backtest | `POST /api/v1/backtest/run` | 10 req/min |
| Health Check | `GET /api/v1/health` | Unlimited |

### PRO Tier License Required

| Feature | Endpoint | Rate Limit |
|---------|----------|------------|
| ML Strategies | `GET /api/v1/strategies/ml` | 100 req/min |
| Premium Data | `GET /api/v1/data/premium` | 100 req/min |
| Advanced Optimization | `POST /api/v1/optimization/run` | 100 req/min |
| Hyperparameter Tuning | `POST /api/v1/hyperparameter/optimize` | 100 req/min |
| Tenant Management | `POST /api/v1/tenants` | 100 req/min |
| ML Model Weights | `POST /api/v1/models/save-weights` | 100 req/min |

### ENTERPRISE Tier License Required

| Feature | Endpoint | Rate Limit |
|---------|----------|------------|
| Arbitrage Scanning | `GET /api/v1/arb/opportunities` | 1000 req/min |
| Multi-Exchange Trading | `POST /api/v1/exchange/multi-trade` | 1000 req/min |
| Custom Strategies | `POST /api/v1/strategies/custom` | 1000 req/min |
| Priority Support | `POST /api/v1/support/priority` | 1000 req/min |
| All PRO Features | Included | 1000 req/min |

---

## API Endpoints Reference

### Health & Status

#### GET `/api/v1/health`

**Tier:** FREE

**Response:**
```json
{
  "status": "healthy",
  "service": "algo-trader-api",
  "version": "0.1.0",
  "timestamp": "2026-03-05T10:00:00.000Z",
  "environment": "production"
}
```

#### GET `/api/v1/ready`

**Tier:** FREE

**Response:**
```json
{
  "status": "ready",
  "checks": {
    "database": "ok",
    "redis": "ok",
    "exchanges": "ok"
  },
  "timestamp": "2026-03-05T10:00:00.000Z"
}
```

---

### Strategies

#### GET `/api/v1/strategies`

**Tier:** PRO

**Headers:**
- `X-API-Key: raas-pro-*` (required)

**Response:**
```json
{
  "strategies": [
    {
      "id": "ml-gru-prediction",
      "name": "GRU Price Prediction",
      "type": "ml",
      "description": "Gated Recurrent Unit neural network for price prediction",
      "minLicense": "PRO"
    },
    {
      "id": "q-learning",
      "name": "Q-Learning Trading",
      "type": "ml",
      "description": "Reinforcement learning based trading strategy",
      "minLicense": "PRO"
    }
  ]
}
```

---

### ML Models

#### POST `/api/v1/models/save-weights`

**Tier:** PRO

**Headers:**
- `X-API-Key: raas-pro-*` (required)
- `Content-Type: application/json`

**Request:**
```json
{
  "modelId": "gru-price-prediction",
  "weights": "<base64-encoded-weights>",
  "metadata": {
    "epoch": 100,
    "loss": 0.0234,
    "accuracy": 0.94
  }
}
```

**Response:**
```json
{
  "success": true,
  "modelId": "gru-price-prediction",
  "savedAt": "2026-03-05T10:00:00.000Z",
  "size": 1048576
}
```

**Error (403):**
```json
{
  "error": "License Required",
  "message": "Saving ML model weights requires PRO license",
  "requiredTier": "pro",
  "currentTier": "free"
}
```

#### POST `/api/v1/models/load-weights`

**Tier:** PRO

**Headers:**
- `X-API-Key: raas-pro-*` (required)

**Request:**
```json
{
  "modelId": "gru-price-prediction"
}
```

**Response:**
```json
{
  "success": true,
  "modelId": "gru-price-prediction",
  "weights": "<base64-encoded-weights>",
  "metadata": {
    "epoch": 100,
    "loss": 0.0234,
    "accuracy": 0.94,
    "savedAt": "2026-03-05T09:00:00.000Z"
  }
}
```

---

### Optimization

#### POST `/api/v1/optimization/run`

**Tier:** PRO

**Headers:**
- `X-API-Key: raas-pro-*` (required)

**Request:**
```json
{
  "strategyId": "macd-rsi",
  "parameters": {
    "rsi_period": [7, 21],
    "macd_fast": [8, 15],
    "macd_slow": [20, 30]
  },
  "optimization": {
    "method": "grid_search",
    "metric": "sharpe_ratio",
    "maxEvaluations": 1000
  }
}
```

**Response:**
```json
{
  "jobId": "opt-12345",
  "status": "queued",
  "estimatedTime": 300,
  "parameters": {
    "total": 1000,
    "queued": 1000
  }
}
```

---

### Hyperparameter Tuning

#### POST `/api/v1/hyperparameter/optimize`

**Tier:** PRO

**Headers:**
- `X-API-Key: raas-pro-*` (required)

**Request:**
```json
{
  "modelId": "gru-price-prediction",
  "hyperparameters": {
    "learning_rate": [0.001, 0.01],
    "hidden_units": [64, 256],
    "dropout": [0.1, 0.5]
  },
  "budget": 50
}
```

**Response:**
```json
{
  "jobId": "hyp-67890",
  "status": "running",
  "bestParams": {
    "learning_rate": 0.005,
    "hidden_units": 128,
    "dropout": 0.2
  },
  "bestScore": 0.89,
  "progress": 25
}
```

---

### Arbitrage (ENTERPRISE Only)

#### GET `/api/v1/arb/opportunities`

**Tier:** ENTERPRISE

**Headers:**
- `X-API-Key: raas-ent-*` (required)

**Query Parameters:**
- `minProfit` (number): Minimum profit percentage
- `exchanges` (string): Comma-separated exchange list

**Response:**
```json
{
  "opportunities": [
    {
      "id": "arb-001",
      "pair": "BTC/USDT",
      "buyExchange": "binance",
      "sellExchange": "coinbase",
      "profit": 0.52,
      "volume": 1.5,
      "expiresAt": "2026-03-05T10:01:00.000Z"
    }
  ],
  "timestamp": "2026-03-05T10:00:00.000Z"
}
```

---

### Tenants (PRO Only)

#### POST `/api/v1/tenants`

**Tier:** PRO

**Headers:**
- `X-API-Key: raas-pro-*` (required)

**Request:**
```json
{
  "name": "My Trading Firm",
  "settings": {
    "defaultExchange": "binance",
    "riskLevel": "medium",
    "maxPositionSize": 10000
  }
}
```

**Response:**
```json
{
  "tenantId": "tenant-123",
  "name": "My Trading Firm",
  "createdAt": "2026-03-05T10:00:00.000Z",
  "status": "active"
}
```

---

### Billing

#### GET `/api/v1/billing/products`

**Tier:** FREE

**Response:**
```json
{
  "products": [
    {
      "id": "starter",
      "name": "Starter Plan",
      "price": 29,
      "currency": "USD",
      "interval": "month",
      "features": ["Basic strategies", "Live trading", "100 API calls/day"]
    },
    {
      "id": "growth",
      "name": "Growth Plan",
      "price": 99,
      "currency": "USD",
      "interval": "month",
      "features": ["ML strategies", "Premium data", "1000 API calls/day"]
    },
    {
      "id": "premium",
      "name": "Premium Plan",
      "price": 299,
      "currency": "USD",
      "interval": "month",
      "features": ["All features", "Unlimited API calls", "Priority support"]
    }
  ]
}
```

#### POST `/api/v1/billing/webhook`

**Tier:** Public (Polar.sh webhook)

**Headers:**
- `X-Polar-Signature` (required)

**Request:** Polar.sh webhook payload

**Response:**
```json
{
  "received": true,
  "signature": "sig_abc123...",
  "note": "Forwarded to origin"
}
```

---

## Error Responses

### 403 License Required

```json
{
  "error": "License Required",
  "message": "This endpoint requires PRO license. Current tier: free",
  "requiredTier": "pro",
  "currentTier": "free"
}
```

### 429 Rate Limit Exceeded

```json
{
  "error": "Rate Limit Exceeded",
  "message": "Too many requests. Please slow down.",
  "retryAfter": 60
}
```

**Headers:**
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Hour-Limit: 100
X-RateLimit-Hour-Remaining: 50
X-RateLimit-Reset: 1678012345
Retry-After: 60
```

### 500 Internal Server Error

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred",
  "stack": "Error: ...\n  at ..." // Only in development
}
```

---

## Rate Limiting

### Limits by Tier

| Tier | Requests/Min | Requests/Hour | Burst/Sec |
|------|--------------|---------------|-----------|
| FREE | 10 | 100 | 2 |
| PRO | 100 | 1,000 | 10 |
| ENTERPRISE | 1,000 | 10,000 | 50 |

### Headers

All responses include rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Hour-Limit: 1000
X-RateLimit-Hour-Remaining: 950
X-RateLimit-Reset: 1678012345
```

---

## SDKs & Client Libraries

### JavaScript/TypeScript

```typescript
import { AlgoTraderClient } from '@algo-trader/sdk';

const client = new AlgoTraderClient({
  apiKey: 'raas-pro-your-key',
  baseUrl: 'https://api.algo-trader.com'
});

// Get ML strategies
const strategies = await client.strategies.list({ type: 'ml' });

// Run optimization
const job = await client.optimization.run({
  strategyId: 'macd-rsi',
  parameters: { rsi_period: [7, 21] }
});
```

### Python

```python
from algo_trader import Client

client = Client(api_key='raas-pro-your-key')

# Get ML strategies
strategies = client.strategies.list(type='ml')

# Run optimization
job = client.optimization.run(
    strategy_id='macd-rsi',
    parameters={'rsi_period': [7, 21]}
)
```

---

## Related Files

| File | Purpose |
|------|---------|
| `src/lib/raas-gate.ts` | Core license service |
| `src/lib/rate-limiter.ts` | Rate limiting logic |
| `src/lib/rate-limiter-middleware.ts` | API middleware |
| `src/api/gateway.ts` | Cloudflare Worker gateway |
| `docs/LICENSE_GATING.md` | License gating documentation |
| `docs/rate-limiting.md` | Rate limiting documentation |

---

## Support

- Documentation: https://docs.algo-trader.com
- API Status: https://status.algo-trader.com
- Support Email: support@algo-trader.com
