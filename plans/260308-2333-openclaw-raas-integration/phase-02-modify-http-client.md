# Phase 02: Modify HTTP Client to Use Gateway

## Context Links
- Previous phase: `plans/260308-2333-openclaw-raas-integration/phase-01-add-raas-gateway-config.md`
- Main plan: `plans/260308-2333-openclaw-raas-integration/plan.md`
- Related files: `lib/raas-license-validator.js`

## Overview
**Priority:** High
**Current Status:** Not Started
**Description:** Modify the existing HTTP client implementation in OpenClaw to route all API requests through the RaaS Gateway instead of calling services directly.

## Key Insights
- OpenClaw currently uses native `fetch` for HTTP calls
- All API requests need to be forwarded through gateway
- Gateway requires proper path routing (append original endpoint to gateway)
- Response format may differ from direct calls
- Need to maintain request/response integrity

## Requirements
### Functional Requirements
- Intercept all HTTP requests from OpenClaw worker
- Forward requests to RaaS Gateway with original path appended
- Preserve all headers, query parameters, and request body
- Handle response transformation if gateway modifies format
- Maintain compatibility with existing API consumers

### Non-Functional Requirements
- Minimal latency overhead (should not significantly increase response time)
- Maintain all HTTP status codes appropriately
- Preserve request/response headers where possible
- Fail-open policy: if gateway unavailable, allow direct calls

## Architecture
```
HTTP Request Flow:
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   OpenClaw      │ -> │  RaaS Gateway    │ -> │  Target Service │
│   Worker        │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        |                      |                       |
        | original request     | proxied request       | processed
        |--------------------->|---------------------->| (with metering)
        |                      |                       |
        |                      | processed response    | response
        |<- response with      |<----------------------|<-
        | metering data        | gateway wrapper       | target data
```

## Related Code Files
- Any files using native `fetch` calls
- HTTP client utilities/wrappers
- API service modules
- Authentication modules that make HTTP calls

## Implementation Steps
1. Identify all locations where OpenClaw makes HTTP requests
2. Create gateway-aware HTTP client wrapper
3. Implement request forwarding logic (append original path to gateway)
4. Handle response transformation if needed
5. Add fallback mechanism for gateway failures
6. Test request/response integrity
7. Benchmark performance impact

## Todo List
- [ ] Locate all native `fetch` calls in OpenClaw codebase
- [ ] Create gateway-aware HTTP client wrapper
- [ ] Implement request forwarding (prepend gateway URL to original path)
- [ ] Preserve all headers, query params, and body
- [ ] Handle response format transformation if needed
- [ ] Implement fail-open mechanism for gateway failures
- [ ] Test request/response integrity
- [ ] Benchmark performance impact
- [ ] Write integration tests

## Success Criteria
- All HTTP requests are properly routed through gateway
- Request/response integrity is maintained
- Original API behavior preserved for consumers
- Gateway failures do not break functionality
- Performance impact is minimal (< 100ms additional latency)
- All tests pass

## Risk Assessment
- **High Risk:** Gateway downtime could affect all API calls
  - Mitigation: Implement robust fail-open mechanism
- **High Risk:** Response format changes could break consumers
  - Mitigation: Thoroughly test response transformation
- **Medium Risk:** Performance degradation from additional hop
  - Mitigation: Optimize gateway communication, implement caching
- **Low Risk:** Header/query param loss during forwarding
  - Mitigation: Comprehensive testing of all request components

## Security Considerations
- Verify SSL certificates for gateway connection
- Prevent header injection attacks
- Sanitize request paths to prevent security issues
- Ensure sensitive headers are properly handled

## Next Steps
- Proceed to Phase 03: Add API key injection
- Ensure HTTP client properly forwards API keys
- Integrate with configuration from Phase 01