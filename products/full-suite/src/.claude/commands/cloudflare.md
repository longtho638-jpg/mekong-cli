---
name: cloudflare
description: Access Cloudflare skill for edge computing, serverless, storage, and AI
allowed_in: [chat, agent]
---

# /cloudflare Command

Load Cloudflare platform reference and get contextual guidance.

## Usage

```
/cloudflare                  # Show decision trees
/cloudflare workers          # Workers quick start
/cloudflare d1               # D1 database guide
/cloudflare r2               # R2 storage guide
/cloudflare kv               # KV store guide
/cloudflare pages            # Pages deployment
/cloudflare ai               # Workers AI guide
```

## Examples

### Deploy API with Database

```
/cloudflare workers d1
```

This will guide you through:

1. Creating a Worker
2. Setting up D1 database
3. Writing CRUD endpoints
4. Deploying to production

### Static Site with Functions

```
/cloudflare pages
```

This will guide you through:

1. Building your static site
2. Adding edge functions
3. Configuring bindings
4. Deploying to Pages

### File Storage

```
/cloudflare r2
```

This will guide you through:

1. Creating R2 bucket
2. Writing upload/download API
3. Configuring public access
4. S3 compatibility

## Decision Trees

When you run `/cloudflare` without arguments, you'll see:

### Running Code

- Static site → Pages
- API/webhook → Workers
- Stateful logic → Durable Objects
- Scheduled tasks → Workers + Cron

### Storage

- Key-value → KV
- SQL/relational → D1
- Large files → R2
- Message queue → Queues

### AI/ML

- Inference → Workers AI
- Embeddings → Vectorize
- AI agents → Agents SDK

## Related Skills

- `devops` - General DevOps including Cloudflare basics
- `backend-development` - API patterns that work with Cloudflare
