# Frontend Dockerfile (Next.js) - Monorepo Build with Turbo Prune
# Multi-stage build for production
# Build context: project root

# 1. Base
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN apk add --no-cache libc6-compat

# 2. Pruner - isolates the dashboard and its dependencies
FROM base AS pruner
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune --scope=mekong-dashboard --docker

# 3. Dependencies
FROM base AS deps
WORKDIR /app
# Install build dependencies for native modules (ssh2, cpu-features) + distutils for Python 3.12
RUN apk add --no-cache python3 make g++ gcc py3-setuptools
# Copy only the pruned package.json's and lockfile
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./
# Install dependencies (skip puppeteer download via env var, allow other optional deps like @parcel/watcher)
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN pnpm install --frozen-lockfile

# 4. Builder
FROM base AS builder
WORKDIR /app
# Copy entire workspace from deps to preserve nested node_modules
COPY --from=deps /app ./
# Copy pruned source code
COPY --from=pruner /app/out/full/ .
# Build specific app
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter mekong-dashboard build

# 5. Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone build
COPY --from=builder --chown=nextjs:nodejs /app/apps/dashboard/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/dashboard/.next/static ./apps/dashboard/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/dashboard/public ./apps/dashboard/public

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/dashboard/server.js"]
