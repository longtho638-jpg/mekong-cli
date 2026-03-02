# Polar.sh Billing Integration Research — Algo Trader RaaS

**Date:** 2026-03-02 | **Target:** Integrate Polar.sh v1 API for multi-tenant trading bot billing
**Scope:** Subscriptions, metered billing, webhooks, TypeScript SDK
**Status:** Ready for implementation planning

---

## 1. API ARCHITECTURE

### Base URLs & Auth
- **Production:** `https://api.polar.sh/v1`
- **Sandbox:** `https://sandbox-api.polar.sh/v1`
- **Auth:** Organization Access Token (OAT) in `Authorization: Bearer` header
- **Rate limit:** 300 req/min per organization

### Core API vs Customer Portal API
- **Core API:** Full control — create products, issue refunds, manage subscriptions (org-level)
- **Customer Portal API:** Read-only customer view of orders, subscriptions, benefits

---

## 2. CORE ENDPOINTS

### Products (Subscription Tiers)
```
POST   /products                    # Create product (FREE/PRO/ENTERPRISE)
GET    /products                    # List all products
GET    /products/{id}               # Get product details
PUT    /products/{id}               # Update product
```

### Subscriptions
```
GET    /subscriptions               # List subscriptions (paginated)
GET    /subscriptions/{id}          # Get subscription details
```

### Customers
```
GET    /customers                   # List customers
POST   /customers                   # Create customer
GET    /customers/{id}              # Get customer details
```

### Orders (Transactions)
```
GET    /orders                      # List orders
GET    /orders/{id}                 # Get order details
```

### Meters (Usage Tracking)
```
POST   /meters                      # Create meter (e.g., "api_calls", "trades_executed")
GET    /meters                      # List meters
POST   /meters/{id}/events          # Ingest usage event
```

---

## 3. USAGE-BASED BILLING (Critical for RaaS)

### Architecture Flow
1. **Create Meter** — Define what to measure (e.g., `trades_executed`, `api_calls`)
   - Filters: Match customer, time window
   - Aggregation: SUM, COUNT, MAX

2. **Add Metered Price** — Attach meter to subscription product
   - Price per unit (e.g., $0.01 per trade)
   - Monthly/yearly cycle

3. **Ingest Events** — Send usage from trading bot
   ```typescript
   await polar.meters.ingestEvent({
     meter_id: "trades_executed",
     customer_id: "cus_123",
     value: 1,
     timestamp: new Date()
   });
   ```

4. **Auto-Calculate Charges** — Polar aggregates events, computes overage, bills at cycle end

### Metered Pricing Benefits
- Grant monthly usage credits (e.g., 100 free trades/month for PRO)
- Automatic overage charging above credits
- Meter credits reset per cycle

---

## 4. WEBHOOK EVENTS (30+ Types)

### Critical Events for RaaS
```
subscription.created      # New subscription (FREE/PRO/ENTERPRISE)
subscription.updated      # Catch-all: active, canceled, uncanceled, past_due, revoked
subscription.active       # Subscription is active
subscription.canceled     # Cancellation initiated
subscription.uncanceled   # Cancellation reversed
customer.created          # New customer
order.created             # Payment processed (transaction)
order.payment_success     # Payment confirmed
```

### Webhook Payload Structure
```typescript
// Standard Webhooks headers (signature verification)
webhook-id: "evt_123"
webhook-timestamp: "2026-03-02T09:27:00Z"
webhook-signature: "v1,base64_signature"

// JSON body
{
  "id": "evt_123",
  "type": "subscription.created",
  "data": {
    "id": "sub_456",
    "customer_id": "cus_789",
    "product_id": "prod_free",
    "status": "active",
    "current_period_start": "2026-03-02",
    "current_period_end": "2026-04-02"
  }
}
```

### Signature Verification
- Polar signs with secret (base64 encoded)
- SDK includes `validateEvent()` function
- TypeScript: `await polar.webhooks.validateEvent(req.body, signature, secret)`

---

## 5. TYPESCRIPT SDK (@polar-sh/sdk)

### Installation
```bash
npm install @polar-sh/sdk
# or pnpm add @polar-sh/sdk
```

### SDK Initialization
```typescript
import { Polar } from "@polar-sh/sdk";

const polar = new Polar({
  server: "production",  // or "sandbox"
  accessToken: process.env.POLAR_ACCESS_TOKEN
});
```

### Common Operations

**Create Product (Subscription Tier)**
```typescript
const product = await polar.products.create({
  name: "PRO Trading Bot",
  description: "Professional 10 trades/day",
  type: "subscription",
  prices: [{
    type: "recurring",
    amount_type: "fixed",
    currency: "usd",
    recurring_interval: "month",
    price_amount: 9900  // $99/month
  }]
});
```

**Ingest Usage Event (Metered)**
```typescript
await polar.meters.ingestEvent({
  meter_name: "trades_executed",
  customer_id: "cus_123",
  value: 5,
  timestamp: new Date()
});
```

**List Subscriptions (Paginated)**
```typescript
const result = await polar.subscriptions.list();
for await (const subscription of result) {
  console.log(subscription.id, subscription.status);
}
```

**Webhook Validation (Express.js)**
```typescript
import { validateEvent } from "@polar-sh/sdk/webhooks";

app.post("/webhooks/polar", async (req, res) => {
  try {
    const event = await validateEvent(
      JSON.stringify(req.body),
      req.headers["webhook-signature"],
      process.env.POLAR_WEBHOOK_SECRET
    );

    if (event.type === "subscription.created") {
      // Provision PRO trading bot for customer
    }
  } catch (error) {
    res.status(401).send("Invalid signature");
  }
});
```

---

## 6. MULTI-TENANT IMPLEMENTATION PATTERNS

### Tier-to-Product Mapping
```
Algo Trader Tier → Polar Product
FREE             → prod_free (0/month)
PRO              → prod_pro (99/month, 10 trades/day)
ENTERPRISE       → prod_ent (custom, unlimited)
```

### Usage Metering Strategy
```
meter_id="bot_executions"
  Filter: customer_id
  Agg: COUNT events/month
  Price: $0.10 per trade above 10/month credit
```

### Tenant Isolation
- `external_customer_id` = `tenant_id` (e.g., "acme-corp")
- Polar webhook → update tenant subscription status in DB
- Verify webhook secret matches org in request

---

## 7. KEY INTEGRATIONS NEEDED

| Component | Integration Point |
|-----------|-------------------|
| Fastify API | POST /webhooks/polar — validate, update subscription |
| Prisma DB | Store polar_customer_id, polar_subscription_id, usage_credits |
| Trading Engine | Send meter events on each bot execution |
| Frontend | Display subscription tier, usage quota, billing portal link |

---

## 8. CRITICAL CONSIDERATIONS

✅ **Strengths**
- Full billing stack (products, checkout, subscriptions, metering)
- Tax compliance built-in
- Standard Webhooks signing (industry standard)
- TypeScript SDK with full type safety
- Usage metering suits RaaS bot trading perfectly

⚠️ **Watch Points**
- Webhook signature = MUST base64 decode secret before verification
- Metered prices only work with subscription products, not one-time
- Customer portal auto-generated (cannot customize heavily)
- Sandbox/production have separate org tokens

---

## UNRESOLVED QUESTIONS

1. How to programmatically set monthly usage credits for PRO tier? (Doc gap)
2. Does Polar support custom success pages post-checkout, or redirect only?
3. Webhook retry policy if our endpoint fails temporarily?
4. Can we update product pricing mid-cycle for existing subscriptions?

---

## REFERENCES

- [Polar API Overview](https://polar.sh/docs/api-reference/introduction)
- [TypeScript SDK (@polar-sh/sdk)](https://www.npmjs.com/package/@polar-sh/sdk)
- [Webhook Events](https://polar.sh/docs/integrate/webhooks/events)
- [Usage-Based Billing](https://polar.sh/docs/features/usage-based-billing/introduction)
- [Setup Webhooks](https://polar.sh/docs/integrate/webhooks/endpoints)
- [Polar Monetization Guide](https://encore.dev/blog/polar-tutorial)
