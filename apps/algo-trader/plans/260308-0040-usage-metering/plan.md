# Usage Metering Implementation Plan

## Overview
Extend RaaS Gateway (Cloudflare Worker v2.0.0) to track and log granular usage metrics per licensed API key for the algo-trader project.

## Current Architecture
- **RaaS Gateway**: Cloudflare Worker handling authentication (JWT + mk_ API keys) and rate limiting
- **Algo-Trader**: Node.js application with UsageTrackerService (in-memory buffered tracking)
- **Auth**: mk_ API keys stored in MK_API_KEYS env var (format: "mk_<key>:<tenantId>:<tier>")

## Requirements
1. Capture request count, payload size, and endpoint type for each authenticated request using mk_ API key
2. Store metrics in dedicated RaaS Usage KV namespace keyed by license ID and timestamp (hourly buckets)
3. Format compatible with Stripe/Polar billing webhooks from Phase 3
4. Validate traffic from agencyos.network dashboard UI

## Implementation Steps

### Phase 1: RaaS Gateway Enhancements

#### Step 1.1: Add Usage Metering Module
- Create `src/kv-usage-meter.ts` (or .js) to handle usage tracking
- Implement hourly bucket generation
- Add KV storage logic
- Include payload size calculation

#### Step 1.2: Extend wrangler.toml
- Add RaaS_USAGE_KV namespace binding
- Document KV creation process

#### Step 1.3: Modify index.js
- Import and initialize usage meter
- Capture metrics for all /v1/* routes
- Include payload size tracking
- Store metrics in KV

#### Step 1.4: Extend edge-auth-handler.js
- Extract license key from mk_ API key for metering
- Pass license info through to metering module

### Phase 2: Usage Metrics Structure

#### Step 2.1: Define Usage Event Schema
```javascript
interface UsageMetric {
  licenseKey: string;
  tenantId: string;
  tier: string;
  endpoint: string;
  method: string;
  requestCount: number;
  payloadSize: number;
  timestamp: string;
  hourBucket: string; // YYYY-MM-DD-HH format
}
```

#### Step 2.2: KV Key Structure
```javascript
// Key format: usage:<licenseKey>:<hourBucket>
const buildUsageKVKey = (licenseKey, hourBucket) => `usage:${licenseKey}:${hourBucket}`;
```

### Phase 3: Billing Compatibility

#### Step 3.1: Ensure Compatibility with Phase 3 Webhooks
- Match usage metric format with existing Polar/Stripe webhook handlers
- Ensure metadata matches billing adapter requirements

#### Step 3.2: Add Usage Query Endpoint
- Create `/v1/usage` endpoint to retrieve metrics
- Support date range and license key filters
- Return aggregated metrics per hour/day/month

### Phase 4: Validation & Testing

#### Step 4.1: Test Traffic Validation
- Verify all agencyos.network dashboard traffic flows through gateway
- Validate usage metrics are correctly captured
- Test with different payload sizes and endpoints

#### Step 4.2: Load Testing
- Test metering under high traffic conditions
- Verify KV storage performance
- Ensure no impact on gateway latency

## Files to Modify
1. `/Users/macbookprom1/mekong-cli/apps/raas-gateway/index.js`
2. `/Users/macbookprom1/mekong-cli/apps/raas-gateway/src/edge-auth-handler.js`
3. `/Users/macbookprom1/mekong-cli/apps/raas-gateway/wrangler.toml`

## Files to Create
1. `/Users/macbookprom1/mekong-cli/apps/raas-gateway/src/kv-usage-meter.js`

## Success Criteria
- All /v1/* requests with mk_ API keys are metered
- Metrics include request count, payload size, endpoint type
- Metrics are stored in RaaS_USAGE_KV with hourly buckets
- Usage data is retrievable via API endpoint
- Traffic from agencyos.network is correctly tracked
- No performance degradation of gateway

## Risk Assessment
- **KV Storage Limits**: Cloudflare KV has per-key size limits (100KB) - need to aggregate metrics
- **Performance**: Metering adds overhead - need to keep logic minimal
- **Data Consistency**: KV is eventually consistent - acceptable for billing purposes

## Next Steps
1. Implement Phase 1 enhancements
2. Test and validate metering
3. Deploy to production
4. Monitor and optimize
