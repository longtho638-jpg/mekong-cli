# Phase 4: Gumroad Integration

## Context
Receive real-time sales data from Gumroad to attribute conversions to affiliates.

## Requirements
- Verify Gumroad webhook signature.
- Parse webhook data.
- Extract affiliate code from custom fields or cookies (passed via URL params to Gumroad if supported, or matching customer email if pre-registered).
- *Strategy*: Gumroad supports `url_params` or `referrer` tracking. We will rely on `ref` parameter passed to Gumroad checkout if possible, or post-purchase attribution via email if the customer is the affiliate (unlikely).
- Better Strategy: When user clicks affiliate link -> Set Cookie -> User goes to Gumroad.
- Gumroad Attribution: We need to pass the affiliate ID to Gumroad during checkout. Gumroad allows `?referrer={code}`.
- If we use Gumroad Overlay, we can pass `referrer` param.
- If we use direct Gumroad links, we need to append `?referrer={code}` when redirecting from our tracking endpoint.

## Files to Modify/Create
- `core/finance/gateways/gumroad.py`: Add webhook verification helper.
- `backend/api/routers/gumroad_webhooks.py`: Handler for `POST /webhooks/gumroad`.

## Implementation Steps
1. Update `GumroadClient` in `core/finance/gateways/gumroad.py` to include a method `verify_webhook(payload, signature)`.
2. Create/Update `gumroad_webhooks.py`.
3. In webhook handler:
   - Verify signature.
   - Extract `sale_id`, `price`, `currency`, `referrer` (affiliate code).
   - Call `AffiliateService.track_conversion(code=referrer, amount=price, ...)`.
4. Handle `sale.refunded` events to update conversion status.

## Note on Attribution
- We must ensure our `GET /affiliates/track/{code}` endpoint redirects to Gumroad with `?referrer={code}` (or similar param Gumroad accepts, or our own `ref` param if we parse it from the `custom_fields` or `referrer` field in the webhook).
- Gumroad passes the `referrer` field in the webhook if present in the purchase URL.
