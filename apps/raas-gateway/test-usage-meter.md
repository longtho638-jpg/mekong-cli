# RaaS Gateway Usage Metering Test Plan

## Test Scenarios

### 1. Basic Usage Tracking
- Send a request to /v1/scan with valid mk_ API key
- Verify usage is tracked in KV
- Check that request count increments
- Verify payload size is calculated correctly

### 2. Different Endpoint Types
- Test /v1/analyze → endpoint type "analyze"
- Test /v1/trade → endpoint type "trade"
- Test /v1/backtest → endpoint type "backtest"
- Test /v1/status → endpoint type "status"
- Test /v1/config → endpoint type "config"
- Test unknown endpoint → endpoint type "unknown"

### 3. Payload Size Calculation
- Send requests with different payload sizes
- Verify payload size is summed correctly

### 4. Hourly Bucketing
- Send requests at different times crossing an hour boundary
- Verify metrics are stored in separate hourly buckets

### 5. Usage Retrieval
- Send multiple requests
- Call /v1/usage endpoint
- Verify metrics are correctly returned

### 6. Authentication
- Test without API key → no tracking
- Test with invalid API key → no tracking
- Test with valid mk_ key → tracking enabled

## Test Setup

### 1. Create KV Namespace
```bash
cd apps/raas-gateway
wrangler kv:namespace create "RAAS_USAGE_KV" --preview
# Replace id in wrangler.toml
```

### 2. Configure Environment
```bash
cp .dev.vars.example .dev.vars
# Add MK_API_KEYS: "mk_test123:test_tenant:pro"
```

### 3. Run Local Dev Server
```bash
wrangler dev
```

## Test Commands

### Send Test Requests
```bash
# Test with mk_ API key
curl -X GET "http://localhost:8787/v1/scan?symbols=BTC,ETH" \
  -H "Authorization: Bearer mk_test123"

# Test with different payload size
curl -X POST "http://localhost:8787/v1/analyze" \
  -H "Authorization: Bearer mk_test123" \
  -H "Content-Type: application/json" \
  -d '{"symbols":["BTC","ETH","SOL"],"indicators":["rsi","sma"],"timeframe":"1h"}'

# Test unknown endpoint
curl -X GET "http://localhost:8787/v1/unknown" \
  -H "Authorization: Bearer mk_test123"
```

### Check Usage Metrics
```bash
curl -X GET "http://localhost:8787/v1/usage" \
  -H "Authorization: Bearer mk_test123"
```

## Expected Outputs

### Usage Metrics Response
```json
{
  "licenseKey": "mk_test123",
  "tenantId": "test_tenant",
  "metrics": [
    {
      "licenseKey": "mk_test123",
      "tenantId": "test_tenant",
      "tier": "pro",
      "endpoint": "scan",
      "method": "GET",
      "requestCount": 1,
      "payloadSize": 0,
      "timestamp": "2026-03-08T10:30:00.000Z",
      "hourBucket": "2026-03-08-10"
    },
    {
      "licenseKey": "mk_test123",
      "tenantId": "test_tenant",
      "tier": "pro",
      "endpoint": "analyze",
      "method": "POST",
      "requestCount": 1,
      "payloadSize": 150,
      "timestamp": "2026-03-08T10:31:00.000Z",
      "hourBucket": "2026-03-08-10"
    },
    {
      "licenseKey": "mk_test123",
      "tenantId": "test_tenant",
      "tier": "pro",
      "endpoint": "unknown",
      "method": "GET",
      "requestCount": 1,
      "payloadSize": 0,
      "timestamp": "2026-03-08T10:32:00.000Z",
      "hourBucket": "2026-03-08-10"
    }
  ],
  "totalRequests": 3,
  "totalPayloadSize": 150
}
```

## Validation Checklist
- [ ] Usage metrics are correctly tracked per mk_ API key
- [ ] Payload size is calculated accurately
- [ ] Endpoint types are correctly identified
- [ ] Metrics are stored in hourly buckets
- [ ] /v1/usage endpoint returns valid data
- [ ] Requests without valid API keys are not tracked
- [ ] Usage tracking works with both GET and POST requests
- [ ] Metrics include tenantId and tier information
