# PRICING MANIFEST — ROIaaS Outcome-Based Billing

> **Lobster Empire** charges by **Agent Actions**, not user seats.
> You pay for outcomes delivered, not hours consumed.

---

## Pricing Model

Every agent action is tracked, categorized, and weighted. Packages include a base quota of actions per billing cycle (monthly). Overage is billed per-action at a discounted rate.

### Action Types & Weights

| Action | Description | Base Weight |
|--------|-------------|-------------|
| `TICKET_RESOLVED` | Support ticket resolved autonomously | 1.0x |
| `ORDER_PROCESSED` | E-commerce/fulfillment order handled | 1.2x |
| `LEAD_GENERATED` | Qualified lead identified and scored | 2.0x |
| `CONTENT_CREATED` | Marketing/social content produced | 1.8x |
| `THREAT_BLOCKED` | Security threat detected and mitigated | 2.5x |
| `WORKFLOW_COMPLETED` | Multi-step automation finished | 1.5x |
| `DATA_ANALYZED` | Dataset processed and insights extracted | 0.5x |
| `ALERT_HANDLED` | Monitoring alert triaged and resolved | 0.8x |

Weights reflect business value — a blocked threat is worth more than a data analysis.

---

## Packages

### 1. SCAVENGER — Free Tier

> *For solo founders testing the waters.*

| Attribute | Value |
|-----------|-------|
| Base Price | $0/mo |
| Included Actions | 50 |
| Overage Cost | $0.50/action |
| Available Actions | TICKET_RESOLVED, DATA_ANALYZED, ALERT_HANDLED |
| Agents | 2 max |
| Support | Community |

**Best for:** Developers evaluating the platform, personal projects, proof of concept.

---

### 2. AUTOMATOR — Growth Tier

> *For teams automating repetitive work.*

| Attribute | Value |
|-----------|-------|
| Base Price | $49/mo |
| Included Actions | 500 |
| Overage Cost | $0.25/action |
| Available Actions | All Scavenger + ORDER_PROCESSED, WORKFLOW_COMPLETED |
| Agents | 12 max |
| Support | Email (48h SLA) |

**Best for:** Small teams with operational bottlenecks — order processing, workflow automation, ticket handling.

---

### 3. RAINMAKER — Scale Tier

> *For businesses turning agents into revenue engines.*

| Attribute | Value |
|-----------|-------|
| Base Price | $199/mo |
| Included Actions | 2,000 |
| Overage Cost | $0.15/action |
| Available Actions | All Automator + LEAD_GENERATED, CONTENT_CREATED |
| Agents | 50 max |
| Support | Priority (24h SLA) |

**Best for:** Revenue teams — lead generation, content production, full-funnel automation at scale.

---

### 4. SHIELD — Enterprise Tier

> *For organizations where security and uptime are non-negotiable.*

| Attribute | Value |
|-----------|-------|
| Base Price | $499/mo |
| Included Actions | 5,000 |
| Overage Cost | $0.10/action |
| Available Actions | All Rainmaker + THREAT_BLOCKED |
| Agents | Unlimited |
| Support | Dedicated (4h SLA) |

**Best for:** Enterprise, fintech, healthcare — security-first operations with compliance requirements.

---

## Billing Mechanics

### Cycle
- Monthly billing cycle (calendar month)
- Actions tracked in real-time
- Invoice generated at cycle close

### Cost Formula
```
total_cost = base_price + max(0, weighted_actions - included_actions) * overage_cost
```

Where `weighted_actions = sum(action_count * action_weight)` for each action type.

### Example: Automator Package

| Action | Count | Weight | Weighted |
|--------|-------|--------|----------|
| TICKET_RESOLVED | 200 | 1.0x | 200 |
| ORDER_PROCESSED | 150 | 1.2x | 180 |
| WORKFLOW_COMPLETED | 100 | 1.5x | 150 |
| **Total** | **450** | | **530** |

```
total = $49 + max(0, 530 - 500) * $0.25 = $49 + $7.50 = $56.50
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/billing/packages` | List all packages with pricing |
| GET | `/api/billing/usage/:userId` | Current usage and cost breakdown |
| POST | `/api/billing/calculate` | Simulate cost for given actions |
| POST | `/api/billing/record` | Record an agent action |

---

## Upgrade Path

```
SCAVENGER → AUTOMATOR → RAINMAKER → SHIELD
   Free       $49/mo      $199/mo     $499/mo
   50 acts    500 acts    2000 acts   5000 acts
```

Upgrades take effect immediately. Downgrades apply at next billing cycle.
