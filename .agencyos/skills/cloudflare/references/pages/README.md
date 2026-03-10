# Cloudflare Pages Reference

## Overview

Pages is Cloudflare's platform for static sites with optional edge functions.

**Use When:**

- Hosting static sites (React, Vue, Next.js, etc.)
- JAMstack applications
- Documentation sites
- Need both static + dynamic (with Functions)

## Quick Start

```bash
# Deploy static site
wrangler pages deploy ./dist

# Create new project
wrangler pages project create my-site

# Local development
wrangler pages dev ./dist
```

## Configuration

```toml
# wrangler.toml (optional for Pages)
name = "my-site"
pages_build_output_dir = "./dist"

# Bindings for Functions
[[kv_namespaces]]
binding = "MY_KV"
id = "xxx"
```

## Functions (Edge API Routes)

Place JavaScript/TypeScript files in `/functions`:

```
my-project/
├── dist/           # Static assets
└── functions/
    ├── api/
    │   └── users.js    # /api/users
    └── hello.js        # /hello
```

### Function File

```javascript
// functions/api/users.js
export async function onRequest(context) {
    const { request, env, params } = context;

    if (request.method === "GET") {
        return Response.json({ users: [] });
    }

    return new Response("Method not allowed", { status: 405 });
}

// Or specific methods
export async function onRequestGet(context) {
    return Response.json({ users: [] });
}

export async function onRequestPost(context) {
    const body = await context.request.json();
    // Create user...
    return Response.json({ created: true });
}
```

### Dynamic Routes

```
functions/
└── api/
    └── users/
        └── [id].js    # /api/users/:id
```

```javascript
// functions/api/users/[id].js
export async function onRequestGet({ params }) {
    const userId = params.id;
    return Response.json({ id: userId });
}
```

## Framework Integration

### Next.js

```bash
# Use next-on-pages
npm i @cloudflare/next-on-pages

# Build
npx @cloudflare/next-on-pages

# Deploy
wrangler pages deploy .vercel/output/static
```

### Remix

```bash
# Use Remix Cloudflare template
npx create-remix@latest --template cloudflare-pages

# Deploy
npm run deploy
```

### Astro

```bash
# Install adapter
npm i @astrojs/cloudflare

# Configure astro.config.mjs
import cloudflare from '@astrojs/cloudflare';
export default { adapter: cloudflare() };
```

## Gotchas

1. **Function Limits**: Same as Workers (10ms CPU, 128MB memory)
2. **No Middleware Stack**: Use `_middleware.js` for shared logic
3. **Static First**: Functions only run for non-static paths
4. **Build Output**: Must be in build output directory
