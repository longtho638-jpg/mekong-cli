# Cloudflare KV Reference

## Overview

KV is a global, low-latency key-value store optimized for **read-heavy workloads**.

**Use When:**

- Caching (API responses, computed data)
- Configuration storage
- Session data
- Feature flags
- Rate limiting counters

**Don't Use When:**

- Complex queries → Use D1
- Large files → Use R2
- Strong consistency required → Use Durable Objects
- High write frequency (>1 write/sec per key)

## Quick Start

```bash
# Create namespace
wrangler kv:namespace create "MY_KV"
# Returns: id = "xxx"

# Create preview namespace (for wrangler dev)
wrangler kv:namespace create "MY_KV" --preview

# Put value
wrangler kv:key put --namespace-id=xxx "key" "value"

# Get value
wrangler kv:key get --namespace-id=xxx "key"
```

## Configuration

```toml
# wrangler.toml
[[kv_namespaces]]
binding = "MY_KV"
id = "production-namespace-id"
preview_id = "preview-namespace-id"
```

## API Reference

### Basic Operations

```javascript
// GET
const value = await env.MY_KV.get("key");
// Returns null if not found

// GET with type
const json = await env.MY_KV.get("key", { type: "json" });
const buffer = await env.MY_KV.get("key", { type: "arrayBuffer" });
const stream = await env.MY_KV.get("key", { type: "stream" });

// GET with metadata
const { value, metadata } = await env.MY_KV.getWithMetadata("key");

// PUT
await env.MY_KV.put("key", "value");

// PUT with expiration (seconds from now)
await env.MY_KV.put("key", "value", { expirationTtl: 3600 });

// PUT with absolute expiration (Unix timestamp)
await env.MY_KV.put("key", "value", { expiration: 1735689600 });

// PUT with metadata
await env.MY_KV.put("key", "value", {
    metadata: { createdBy: "user123", version: 2 },
});

// DELETE
await env.MY_KV.delete("key");

// LIST keys
const list = await env.MY_KV.list();
for (const key of list.keys) {
    console.log(key.name, key.metadata);
}

// LIST with prefix
const list = await env.MY_KV.list({ prefix: "user:" });

// LIST with pagination
let cursor = null;
do {
    const list = await env.MY_KV.list({ cursor });
    for (const key of list.keys) {
        console.log(key.name);
    }
    cursor = list.list_complete ? null : list.cursor;
} while (cursor);
```

## Patterns

### Cache-Aside Pattern

```javascript
async function getCachedData(key, fetchFn, ttl = 3600) {
    // Try cache first
    const cached = await env.CACHE.get(key, { type: "json" });
    if (cached) return cached;

    // Fetch fresh data
    const data = await fetchFn();

    // Store in cache
    await env.CACHE.put(key, JSON.stringify(data), {
        expirationTtl: ttl,
    });

    return data;
}

// Usage
const user = await getCachedData(
    `user:${userId}`,
    () => fetchUserFromDatabase(userId),
    3600,
);
```

### Rate Limiting

```javascript
async function checkRateLimit(ip, limit = 100, window = 60) {
    const key = `ratelimit:${ip}`;
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - (now % window);
    const windowKey = `${key}:${windowStart}`;

    const current = parseInt(await env.LIMITS.get(windowKey)) || 0;

    if (current >= limit) {
        return { allowed: false, remaining: 0 };
    }

    await env.LIMITS.put(windowKey, String(current + 1), {
        expirationTtl: window * 2,
    });

    return { allowed: true, remaining: limit - current - 1 };
}
```

### Feature Flags

```javascript
async function isFeatureEnabled(feature, userId) {
    // Check user-specific override
    const userFlag = await env.FLAGS.get(`feature:${feature}:user:${userId}`);
    if (userFlag !== null) return userFlag === "true";

    // Check percentage rollout
    const config = await env.FLAGS.get(`feature:${feature}`, { type: "json" });
    if (!config) return false;

    if (config.percentage) {
        // Consistent hashing for user
        const hash = hashUserId(userId);
        return hash % 100 < config.percentage;
    }

    return config.enabled || false;
}
```

### Session Storage

```javascript
async function getSession(sessionId) {
    return env.SESSIONS.get(`session:${sessionId}`, { type: "json" });
}

async function setSession(sessionId, data, ttl = 86400) {
    await env.SESSIONS.put(`session:${sessionId}`, JSON.stringify(data), {
        expirationTtl: ttl,
    });
}

async function deleteSession(sessionId) {
    await env.SESSIONS.delete(`session:${sessionId}`);
}
```

## Gotchas

1. **Eventual Consistency**: Writes take ~60 seconds to propagate globally. Use Durable Objects for strong consistency.

2. **Value Size**: Max 25MB per value. Use R2 for larger data.

3. **Key Size**: Max 512 bytes per key.

4. **Write Limits**: ~1 write/second per key. Batch updates.

5. **List Performance**: Expensive operation. Cache list results.

6. **No Atomic Operations**: No increment/decrement. Use Durable Objects for counters.

7. **Expiration Granularity**: 60-second minimum. Use Durable Objects for precise timing.
