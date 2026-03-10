# RaaS Gateway CLI - Phase 6 Documentation

## Overview

TypeScript CLI cho RaaS Gateway tại `raas.agencyos.network` với JWT authentication và rate limit handling.

## Installation

```bash
cd apps/raas-gateway-cli
pnpm install
pnpm build
```

## Usage

### Login (Authenticate)

```bash
# Login với API key
pnpm start login mk_<tenant>_<secret>

# Hoặc set env var
export MK_API_KEY=mk_<tenant>_<secret>
pnpm start status
```

### Commands

| Command | Description |
|---------|-------------|
| `login <api-key>` | Set và validate API key |
| `status` | Show gateway status, tenant info, rate limits |
| `services` | List available agents/services |
| `invoke <task>` | Invoke workflow/task |

### Global Options

```bash
pnpm start status --verbose     # Enable debug logging
pnpm start --api-key mk_xxx status  # Override env var
pnpm start --base-url https://custom.url status  # Override base URL
```

## Authentication Flow

1. **API Key Format**: `mk_<tenant>_<secret>`
2. **Transmission**: `X-API-Key` header
3. **Validation**: Gateway validates against `MK_API_KEYS` env var
4. **Expiry**: Static keys (no expiry) - rotate manually

## Error Handling

### Auth Errors (401/403)
```
❌ Error: Authentication failed
   Invalid or expired API key. Please re-authenticate with `raas-cli auth`.
```

### Rate Limit (429)
```
❌ Error: Rate limit exceeded
   Too many requests. Retry after X seconds or wait until rate limit resets.
```

Auto-retry: Max 3 attempts with exponential backoff (2^retryCount seconds).

### Network Errors
```
❌ Error: Network error
   Unable to connect to https://raas.agencyos.network
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Auth error (invalid/expired key) |
| 2 | Network error (timeout, DNS, connection) |
| 3 | API error (task failed) |

## Security

- API key redacted in verbose logs: `Bearer [REDACTED]`
- Raw key không hiển thị khi persist: `mk_[REDACTED]`
- No token storage - chỉ dùng env var

## Architecture

```
src/
├── index.ts         # CLI entry point (commander)
├── client.ts        # RaaSClient HTTP class
├── auth.ts          # JWT utilities (validate, decode)
└── types.ts         # TypeScript interfaces
```

## Testing

```bash
# Type check
pnpm run build

# Test with real gateway (requires valid API key)
export MK_API_KEY=mk_test_tenant_secret
pnpm start login mk_test_tenant_secret
pnpm start status
```

## Next Steps (Phase 7+)

- [ ] Config file persistence (~/.mekong/raas-config.json)
- [ ] Token refresh mechanism
- [ ] Command cost tracking
- [ ] Usage batch sync to gateway
- [ ] Offline mode with local queue
