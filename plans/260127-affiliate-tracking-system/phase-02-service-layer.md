# Phase 2: Affiliate Service Layer & Payout Logic

## Context
Business logic for managing affiliates, tracking conversions, and calculating payouts with tax rules.

## Requirements
- Generate unique affiliate codes.
- Calculate commissions based on rate.
- Implement Vietnam tax logic (0.5% vs 20%).
- Manage payout periods and status transitions.

## Files to Create
- `backend/services/affiliate_service.py`

## Logic Details

### Tax Calculation (VN Rules)
```python
def calculate_tax(amount_vnd: float, quarter_total: float) -> dict:
    THRESHOLD = 500_000_000  # VND
    if quarter_total + amount_vnd <= THRESHOLD:
        return {"rate": 0.005, "method": "simplified"}
    else:
        return {"rate": 0.20, "method": "standard + VAT"}
```
*Note: We need to handle currency conversion if amounts are in USD.*

### Commission Logic
- `commission = sale_amount * affiliate.commission_rate`
- Handle refunds: If a sale is refunded, the conversion status changes and commission is deducted/voided.

## Implementation Steps
1. Create `AffiliateService` class.
2. Implement `create_affiliate`: Generate unique code.
3. Implement `track_conversion`: Record sale, calculate commission.
4. Implement `generate_payouts`: Aggregate pending conversions, apply tax logic, create Payout records.
5. Implement `get_dashboard_stats`: Aggregate clicks, conversions, earnings.
