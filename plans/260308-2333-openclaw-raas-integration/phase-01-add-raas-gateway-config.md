# Phase 01: Add RaaS Gateway Configuration

## Context Links
- Research report: `plans/reports/openclaw-raas-research.md`
- Main plan: `plans/260308-2333-openclaw-raas-integration/plan.md`
- Related files: `lib/raas-license-validator.js`

## Overview
**Priority:** High
**Current Status:** Not Started
**Description:** Set up configuration for RaaS Gateway integration including endpoint URL, default settings, and environment variables for gateway connection.

## Key Insights
- RaaS Gateway endpoint: `https://raas.agencyos.network`
- Gateway validation endpoint: `/v1/auth/validate`
- Need to support caching (5 minutes) for validation results
- Configuration should be easily overrideable for different environments

## Requirements
### Functional Requirements
- Define RaaS Gateway base URL as configurable parameter
- Set up default timeouts and retry policies
- Configure caching mechanism for validation results (5 minutes)
- Support environment-specific configurations (dev/prod)

### Non-Functional Requirements
- Configuration should be accessible globally within OpenClaw worker
- Environment variables should override defaults
- Secure storage of sensitive configuration values
- Minimal performance overhead for configuration access

## Architecture
```
Configuration Layer:
├── Environment Variables
├── Default Config Values
├── Gateway URL Management
└── Caching Policy Configuration
```

## Related Code Files
- `config/index.js` or similar config file
- `lib/raas-license-validator.js` - for caching integration
- `.env.example` - add new environment variables
- Any startup/configuration files

## Implementation Steps
1. Define RaaS Gateway configuration constants and defaults
2. Create environment variable mappings for gateway settings
3. Implement caching configuration (5-minute TTL)
4. Add gateway URL validation and health check
5. Integrate with existing config loading mechanism
6. Update `.env.example` with new configuration variables
7. Document configuration options

## Todo List
- [ ] Create RaaS Gateway configuration object
- [ ] Add environment variables: `RAAS_GATEWAY_URL`, `RAAS_CACHE_TTL_MINUTES`, `RAAS_REQUEST_TIMEOUT_MS`
- [ ] Implement caching configuration with 5-minute default
- [ ] Add gateway URL validation function
- [ ] Update configuration loading to include RaaS settings
- [ ] Update `.env.example` file
- [ ] Add configuration documentation
- [ ] Write unit tests for configuration loading

## Success Criteria
- Configuration can be loaded from environment variables
- Default values are sensible and documented
- Caching TTL can be configured (default 5 minutes)
- Gateway URL validation works correctly
- All configuration tests pass
- No breaking changes to existing configuration

## Risk Assessment
- **High Risk:** Incorrect gateway URL could break all API calls
  - Mitigation: Add URL validation and fallback mechanisms
- **Medium Risk:** Caching misconfiguration could cause invalid validation results
  - Mitigation: Implement proper cache invalidation and monitoring
- **Low Risk:** Environment variable conflicts with existing variables
  - Mitigation: Use unique prefixes (RAAS_)

## Security Considerations
- API keys should not be stored in configuration files
- Gateway URL should be validated to prevent SSRF attacks
- Timeout values should prevent hanging connections
- Configuration loading should not expose sensitive data

## Next Steps
- Proceed to Phase 02: Modify HTTP client to use gateway
- Ensure configuration is properly integrated with HTTP client
- Begin implementation of gateway-aware HTTP client