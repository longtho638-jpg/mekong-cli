# Deployment Guide

Deploying your Next.js admin dashboard to production.

## Vercel (Recommended)

The easiest way to deploy Next.js apps is Vercel.

1.  Push your code to a Git repository (GitHub, GitLab, Bitbucket).
2.  Import the project in Vercel.
3.  Vercel will automatically detect Next.js.
4.  Click **Deploy**.

## Docker

A `Dockerfile` is not included by default but can be added for containerized deployment.

1.  Create `Dockerfile` in the root:
    ```dockerfile
    FROM node:18-alpine AS base

    FROM base AS deps
    RUN apk add --no-cache libc6-compat
    WORKDIR /app
    COPY package.json package-lock.json ./
    RUN npm ci

    FROM base AS builder
    WORKDIR /app
    COPY --from=deps /app/node_modules ./node_modules
    COPY . .
    RUN npm run build

    FROM base AS runner
    WORKDIR /app
    ENV NODE_ENV production
    COPY --from=builder /app/public ./public
    COPY --from=builder /app/.next/standalone ./
    COPY --from=builder /app/.next/static ./.next/static

    EXPOSE 3000
    ENV PORT 3000
    CMD ["node", "server.js"]
    ```

2.  Update `next.config.js` to enable standalone output:
    ```javascript
    module.exports = {
      output: 'standalone',
    }
    ```

3.  Build and run:
    ```bash
    docker build -t saas-admin .
    docker run -p 3000:3000 saas-admin
    ```

## Static Export

If you don't need server-side features (API routes, dynamic OG images), you can export as a static site.

1.  Update `next.config.js`:
    ```javascript
    module.exports = {
      output: 'export',
    }
    ```

2.  Run `npm run build`. The output will be in the `out` directory.
