# Cloudflare Workers Reference

## Overview

Workers are serverless functions that run on Cloudflare's edge network (300+ locations).

**Use When:**

- Building APIs and webhooks
- Request/response transformation
- Authentication and authorization
- A/B testing and feature flags
- Edge-side rendering

## API Reference

### Request Handler

```javascript
export default {
    async fetch(request, env, ctx) {
        // request: incoming Request object
        // env: bindings (KV, D1, R2, secrets)
        // ctx: ExecutionContext (waitUntil, passThroughOnException)

        return new Response("Hello World");
    },
};
```

### Request Object

```javascript
request.method; // GET, POST, etc.
request.url; // Full URL string
request.headers; // Headers object
request.body; // ReadableStream
await request.json(); // Parse JSON body
await request.text(); // Get body as string
await request.formData(); // Parse form data
```

### Response Object

```javascript
// Simple response
new Response("Hello", { status: 200 });

// JSON response
Response.json({ data: "value" });

// Redirect
Response.redirect("https://example.com", 301);

// With headers
new Response("Hello", {
    headers: { "Content-Type": "text/plain" },
});
```

### Environment Bindings

```javascript
// Access in handler
export default {
    async fetch(request, env) {
        // KV Namespace
        await env.MY_KV.get("key");

        // D1 Database
        await env.DB.prepare("SELECT *").all();

        // R2 Bucket
        await env.BUCKET.get("file.pdf");

        // Secret
        const apiKey = env.API_KEY;

        // Service binding (call another Worker)
        const response = await env.OTHER_WORKER.fetch(request);
    },
};
```

## Configuration (wrangler.toml)

```toml
name = "my-worker"
main = "src/index.js"
compatibility_date = "2024-01-01"

# Environment variables
[vars]
PUBLIC_VAR = "value"

# Routes
routes = [
  { pattern = "api.example.com/*", zone_name = "example.com" }
]

# Cron triggers
[triggers]
crons = ["0 * * * *"]  # Every hour

# Bindings
[[kv_namespaces]]
binding = "MY_KV"
id = "abc123"

[[d1_databases]]
binding = "DB"
database_name = "my-db"
database_id = "xyz789"

[[r2_buckets]]
binding = "BUCKET"
bucket_name = "my-bucket"
```

## Patterns

### REST API Router

```javascript
export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const path = url.pathname;

        // Route matching
        if (path === "/api/users" && request.method === "GET") {
            return handleGetUsers(env);
        }
        if (path.startsWith("/api/users/") && request.method === "GET") {
            const id = path.split("/")[3];
            return handleGetUser(id, env);
        }
        if (path === "/api/users" && request.method === "POST") {
            return handleCreateUser(request, env);
        }

        return new Response("Not found", { status: 404 });
    },
};
```

### Middleware Pattern

```javascript
async function withAuth(request, env, handler) {
    const token = request.headers.get("Authorization");
    if (!token || !(await validateToken(token, env))) {
        return new Response("Unauthorized", { status: 401 });
    }
    return handler(request, env);
}

export default {
    async fetch(request, env) {
        return withAuth(request, env, async (req, e) => {
            return new Response("Protected content");
        });
    },
};
```

### Error Handling

```javascript
export default {
    async fetch(request, env, ctx) {
        try {
            return await handleRequest(request, env);
        } catch (error) {
            // Log error (use ctx.waitUntil for async logging)
            ctx.waitUntil(logError(error, env));

            return new Response(
                JSON.stringify({
                    error: "Internal Server Error",
                }),
                {
                    status: 500,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }
    },
};
```

## Gotchas

1. **CPU Time Limit**: 10ms CPU time (not wall clock). Use `ctx.waitUntil()` for background tasks.

2. **Memory Limit**: 128MB. Stream large files instead of loading into memory.

3. **No Node.js APIs**: Use Web APIs. No `fs`, `path`, etc. Use polyfills if needed.

4. **Subrequest Limit**: 1000 subrequests per invocation. Batch when possible.

5. **Body Consumption**: Request/Response body can only be read once. Clone if needed:

    ```javascript
    const clone = request.clone();
    const body1 = await request.json();
    const body2 = await clone.json(); // Works!
    ```

6. **Headers Immutable**: Create new Response to modify:
    ```javascript
    const response = await fetch(request);
    const newResponse = new Response(response.body, response);
    newResponse.headers.set("X-Custom", "value");
    return newResponse;
    ```
